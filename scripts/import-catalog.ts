import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  deleteResource,
  deleteStage,
  reorderResources,
  upsertExplainBackPrompt,
  upsertResource,
  upsertSkill,
  upsertStage,
  type CatalogDb,
  type CatalogWrite,
} from "@/lib/services/catalog";
import { storedSource } from "@/lib/stored-source";
import { readTagOrigins } from "@/lib/plan/tags";

/** Live skill slug → catalog file name. The file keeps the researched slug. */
const FILE_BY_SLUG: Record<string, string> = {
  "full-stack-web-dev": "full-stack-web-development",
};

const catalogSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  status: z.enum(["AVAILABLE", "COMING_SOON"]),
  stages: z.array(
    z.object({
      order: z.number().int().min(1),
      title: z.string().trim().min(1),
      level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
      description: z.string().trim().min(1),
      learningObjectives: z.array(z.string().trim().min(1)).min(1),
      explainBack: z.object({
        question: z.string().trim().min(1),
        rubric: z.array(z.string().trim().min(1)).min(1),
      }),
      resources: z.array(
        z.object({
          order: z.number().int().min(1),
          type: z.enum(["EMBEDDED_VIDEO", "DOC_LINK", "COURSE_LINK"]),
          needsReview: z.boolean(),
          isFree: z.boolean(),
          language: z.string().trim().min(1),
          title: z.string().trim().min(1),
          provider: z.string().trim().min(1),
          author: z.string().trim().min(1).optional(),
          url: z.string().trim().min(1),
          description: z.string().trim().min(1),
          keyPoints: z.array(z.string().trim().min(1)).min(1),
          videoId: z.string().trim().min(1).optional(),
          durationMinutes: z.number().int().min(1).max(600).optional(),
          depth: z.enum(["INTRO", "STANDARD", "DEEP"]).optional(),
          isCore: z.boolean().optional(),
          captionLanguages: z.array(z.string().trim().min(2).max(16)).max(8).optional(),
        }),
      ).min(1),
    }),
  ).min(1),
});

type CatalogFile = z.infer<typeof catalogSchema>;
type Change = { action: "create" | "update" | "delete"; kind: string; label: string };

function catalogPath(slug: string) {
  const fileName = FILE_BY_SLUG[slug] ?? slug;
  return {
    fileName,
    filePath: path.join(process.cwd(), "content", "catalog", `${fileName}.json`),
  };
}

async function readCatalog(slug: string) {
  const { fileName, filePath } = catalogPath(slug);
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`No catalog file for ${slug}. Expected ${path.relative(process.cwd(), filePath)}.`);
    }
    throw error;
  }
  const parsed = catalogSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "The catalog file is not valid.");
  if (parsed.data.slug !== fileName) {
    throw new Error(`The catalog slug is ${parsed.data.slug}, but the file is ${fileName}.json.`);
  }
  const orders = new Set<number>();
  for (const stage of parsed.data.stages) {
    if (orders.has(stage.order)) throw new Error(`Stage ${stage.order} is listed twice.`);
    orders.add(stage.order);
    const urls = new Set<string>();
    for (const resource of stage.resources) {
      const url = storedSource(resource.url);
      if (!url) throw new Error(`Resource link is not an https URL: ${resource.title}`);
      if (urls.has(url)) throw new Error(`Duplicate link on stage ${stage.order}: ${resource.title}`);
      urls.add(url);
      if (resource.type === "EMBEDDED_VIDEO" && !resource.videoId) {
        throw new Error(`Missing video id: ${resource.title}`);
      }
    }
  }
  return { fileName, catalog: parsed.data };
}

function sameLines(left: string[], right: string[]) {
  return left.length === right.length && left.every((line, index) => line === right[index]);
}

function link(url: string) {
  const stored = storedSource(url);
  if (!stored) throw new Error(`Resource link is not an https URL: ${url}`);
  return stored;
}

function must<T>(result: CatalogWrite<T>) {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function loadSkill(slug: string) {
  return prisma.skill.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      stages: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          title: true,
          description: true,
          level: true,
          learningObjectives: true,
          resources: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              type: true,
              url: true,
              title: true,
              description: true,
              keyPoints: true,
              provider: true,
              author: true,
              videoId: true,
              isFree: true,
              language: true,
              needsReview: true,
              durationMinutes: true,
              depth: true,
              isCore: true,
              captionLanguages: true,
              tagOrigins: true,
            },
          },
          explainBackPrompt: { select: { question: true, rubric: true } },
        },
      },
    },
  });
}

type SkillRow = NonNullable<Awaited<ReturnType<typeof loadSkill>>>;

function planChanges(skill: SkillRow, catalog: CatalogFile): Change[] {
  const changes: Change[] = [];
  const skillFields = [
    skill.name !== catalog.name ? "name" : "",
    (skill.description ?? "") !== catalog.description ? "description" : "",
  ].filter(Boolean);
  if (skillFields.length > 0) {
    changes.push({ action: "update", kind: "skill", label: `skill — ${skillFields.join(", ")}` });
  }

  const stagesByOrder = new Map(skill.stages.map((stage) => [stage.order, stage]));
  const catalogOrders = new Set(catalog.stages.map((stage) => stage.order));

  for (const stage of catalog.stages) {
    const existing = stagesByOrder.get(stage.order);
    if (!existing) {
      changes.push({ action: "create", kind: "stage", label: `stage ${stage.order} — ${stage.title}` });
    } else if (
      existing.title !== stage.title ||
      (existing.description ?? "") !== stage.description ||
      existing.level !== stage.level ||
      !sameLines(existing.learningObjectives, stage.learningObjectives)
    ) {
      changes.push({ action: "update", kind: "stage", label: `stage ${stage.order} — ${stage.title}` });
    }

    const resources = existing?.resources ?? [];
    const byUrl = new Map(resources.map((resource) => [resource.url, resource]));
    const catalogUrls = stage.resources.map((resource) => link(resource.url));

    stage.resources.forEach((resource, index) => {
      const url = catalogUrls[index];
      const current = byUrl.get(url);
      const label = `resource ${stage.order}.${resource.order} — ${resource.title}`;
      if (!current) {
        changes.push({ action: "create", kind: "resource", label });
        return;
      }
      const changed =
        current.type !== resource.type ||
        current.title !== resource.title ||
        (current.description ?? "") !== resource.description ||
        !sameLines(current.keyPoints, resource.keyPoints) ||
        current.provider !== resource.provider ||
        (current.author ?? "") !== (resource.author ?? "") ||
        (current.videoId ?? "") !== (resource.videoId ?? "") ||
        current.isFree !== resource.isFree ||
        current.language !== resource.language ||
        current.needsReview !== resource.needsReview ||
        (resource.durationMinutes !== undefined && current.durationMinutes !== resource.durationMinutes && readTagOrigins(current.tagOrigins).durationMinutes !== "admin") ||
        (resource.depth !== undefined && current.depth !== resource.depth && readTagOrigins(current.tagOrigins).depth !== "admin") ||
        (resource.isCore !== undefined && current.isCore !== resource.isCore && readTagOrigins(current.tagOrigins).isCore !== "admin") ||
        (resource.captionLanguages !== undefined && !sameLines(current.captionLanguages, resource.captionLanguages) && readTagOrigins(current.tagOrigins).captionLanguages !== "admin");
      if (changed) changes.push({ action: "update", kind: "resource", label });
    });

    for (const resource of resources) {
      if (!catalogUrls.includes(resource.url)) {
        changes.push({
          action: "delete",
          kind: "resource",
          label: `resource ${stage.order}.${resource.order} — ${resource.title}`,
        });
      }
    }

    const prompt = existing?.explainBackPrompt;
    const promptLabel = `explain-back ${stage.order}`;
    if (!prompt) changes.push({ action: "create", kind: "explain-back", label: promptLabel });
    else if (prompt.question !== stage.explainBack.question || !sameLines(prompt.rubric, stage.explainBack.rubric)) {
      changes.push({ action: "update", kind: "explain-back", label: promptLabel });
    }
  }

  for (const stage of skill.stages) {
    if (!catalogOrders.has(stage.order)) {
      changes.push({ action: "delete", kind: "stage", label: `stage ${stage.order} — ${stage.title}` });
    }
  }

  return changes;
}

async function writeCatalog(tx: CatalogDb, skillId: string, slug: string, catalog: CatalogFile) {
  must(await upsertSkill({ slug, name: catalog.name, description: catalog.description }, tx));

  for (const stage of catalog.stages) {
    const saved = must(
      await upsertStage(
        {
          skillId,
          order: stage.order,
          title: stage.title,
          description: stage.description,
          level: stage.level,
          learningObjectives: stage.learningObjectives,
        },
        tx,
      ),
    );

    for (const resource of stage.resources) {
      must(
        await upsertResource(
          {
            stageId: saved.id,
            type: resource.type,
            url: resource.url,
            title: resource.title,
            description: resource.description,
            keyPoints: resource.keyPoints,
            provider: resource.provider,
            author: resource.author ?? "",
            videoId: resource.videoId,
            isFree: resource.isFree,
            language: resource.language,
            needsReview: resource.needsReview,
            tagSource: "catalog",
            ...(resource.durationMinutes !== undefined ? { durationMinutes: resource.durationMinutes } : {}),
            ...(resource.depth !== undefined ? { depth: resource.depth } : {}),
            ...(resource.isCore !== undefined ? { isCore: resource.isCore } : {}),
            ...(resource.captionLanguages !== undefined ? { captionLanguages: resource.captionLanguages } : {}),
          },
          tx,
        ),
      );
    }

    const urls = new Set(stage.resources.map((resource) => link(resource.url)));
    const rows = await tx.resource.findMany({ where: { stageId: saved.id }, select: { id: true, url: true } });
    for (const row of rows) {
      if (!urls.has(row.url)) must(await deleteResource({ id: row.id }, tx));
    }

    const remaining = await tx.resource.findMany({ where: { stageId: saved.id }, select: { id: true, url: true } });
    const idsByUrl = new Map(remaining.map((row) => [row.url, row.id]));
    const resourceIds = stage.resources.map((resource) => {
      const id = idsByUrl.get(link(resource.url));
      if (!id) throw new Error(`Missing resource after save: ${resource.title}`);
      return id;
    });
    if (resourceIds.length > 0) must(await reorderResources({ stageId: saved.id, resourceIds }, tx));

    must(
      await upsertExplainBackPrompt(
        { stageId: saved.id, question: stage.explainBack.question, rubric: stage.explainBack.rubric },
        tx,
      ),
    );
  }

  const orders = new Set(catalog.stages.map((stage) => stage.order));
  const extras = await tx.roadmapStage.findMany({ where: { skillId }, select: { id: true, order: true } });
  for (const extra of extras) {
    if (!orders.has(extra.order)) must(await deleteStage({ id: extra.id }, tx));
  }
}

function printPlan(changes: Change[]) {
  if (changes.length === 0) {
    console.log("Nothing to change.");
  } else {
    for (const change of changes) console.log(`${change.action} ${change.label}`);
  }
  const kinds = ["stage", "resource", "explain-back", "skill"];
  for (const kind of kinds) {
    const rows = changes.filter((change) => change.kind === kind);
    const count = (action: Change["action"]) => rows.filter((change) => change.action === action).length;
    console.log(`${kind}: ${count("create")} create, ${count("update")} update, ${count("delete")} delete`);
  }
  console.log("Skill status, image, and flagship flag are left unchanged.");
}

export async function importCatalog(slug: string, options: { apply?: boolean } = {}) {
  const { fileName, catalog } = await readCatalog(slug);
  const skill = await loadSkill(slug);
  if (!skill) {
    throw new Error(`No skill with slug ${slug}. Import writes into the existing row and does not create a skill.`);
  }

  const changes = planChanges(skill, catalog);
  const mode = options.apply ? "Applying" : "Dry run";
  console.log(`${mode} ${slug} from content/catalog/${fileName}.json`);
  printPlan(changes);

  if (!options.apply) {
    console.log("Dry run only. Pass --apply to write.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await writeCatalog(tx, skill.id, slug, catalog);
  }, { timeout: 60_000 });
  console.log("Applied.");
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

if (isDirectRun()) {
  const slug = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!slug || slug.startsWith("--")) {
    console.error("Usage: npx tsx --conditions=react-server scripts/import-catalog.ts <skill-slug> [--apply]");
    process.exit(1);
  }
  importCatalog(slug, { apply })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
