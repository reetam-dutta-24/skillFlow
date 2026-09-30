import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { checkCatalogLink, isFatalLink, outcomeText, type LinkOutcome } from "@/lib/catalog-link-check";
import { prisma } from "@/lib/prisma";

/** Live skill slug → catalog file name. The file keeps the researched slug. */
const FILE_BY_SLUG: Record<string, string> = {
  "full-stack-web-dev": "full-stack-web-development",
};

const DELAY_MS = 400;

const resourceSchema = z.object({
  order: z.number().int(),
  type: z.enum(["EMBEDDED_VIDEO", "DOC_LINK", "COURSE_LINK"]),
  needsReview: z.boolean(),
  title: z.string(),
  provider: z.string(),
  author: z.string().optional(),
  url: z.string(),
  videoId: z.string().optional(),
});

const catalogSchema = z.object({
  slug: z.string(),
  name: z.string(),
  stages: z.array(
    z.object({
      order: z.number().int(),
      title: z.string(),
      resources: z.array(resourceSchema),
    }),
  ),
});

type Catalog = z.infer<typeof catalogSchema>;
type Resource = z.infer<typeof resourceSchema>;

type Checked = {
  stageOrder: number;
  stageTitle: string;
  resource: Resource;
  outcome: LinkOutcome;
  mismatches: { label: string; catalog: string; found: string }[];
  finalUrl: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function catalogFile(slug: string) {
  const fileName = FILE_BY_SLUG[slug] ?? slug;
  return {
    fileName,
    filePath: path.join(process.cwd(), "content", "catalog", `${fileName}.json`),
  };
}

async function readCatalog(slug: string) {
  const { fileName, filePath } = catalogFile(slug);
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
  return { fileName, catalog: parsed.data };
}

function problem(outcome: LinkOutcome) {
  return outcome.kind !== "ok";
}

async function checkCatalog(catalog: Catalog) {
  const checked: Checked[] = [];
  const resources = catalog.stages.flatMap((stage) => stage.resources.map((resource) => ({ stage, resource })));

  for (let index = 0; index < resources.length; index += 1) {
    if (index > 0) await sleep(DELAY_MS);
    const { stage, resource } = resources[index];
    const result = await checkCatalogLink(resource);
    checked.push({
      stageOrder: stage.order,
      stageTitle: stage.title,
      resource,
      outcome: result.outcome,
      mismatches: result.mismatches,
      finalUrl: result.finalUrl,
    });
    console.log(`${index + 1}/${resources.length} ${stage.order}.${resource.order} ${outcomeText(result.outcome)}`);
  }

  return checked;
}

function bulletLink(item: Checked) {
  const lines = [
    `### Stage ${item.stageOrder}.${item.resource.order} — ${item.resource.title}`,
    "",
    `- Stage: ${item.stageTitle}`,
    `- Type: ${item.resource.type}`,
    `- Link: ${item.resource.url}`,
    `- Result: ${outcomeText(item.outcome)}`,
  ];
  if (item.finalUrl) lines.push(`- Final URL: ${item.finalUrl}`);
  return lines.join("\n");
}

function reportMarkdown(slug: string, fileName: string, catalog: Catalog, checked: Checked[]) {
  const problems = checked.filter((item) => problem(item.outcome));
  const mismatches = checked.filter((item) => item.mismatches.length > 0);
  const reviews = checked.filter((item) => item.resource.needsReview);
  const count = (kind: LinkOutcome["kind"]) => checked.filter((item) => item.outcome.kind === kind).length;
  const checkedOn = new Date().toISOString().slice(0, 10);

  const sections = [
    `# Catalog link check: ${fileName}`,
    "",
    `Checked ${checkedOn} for skill \`${slug}\` (${catalog.name}). ${checked.length} resources. This check does not change the catalog.`,
    "",
    "## Summary",
    "",
    `- OK: ${count("ok")}`,
    `- Embedding disabled: ${count("embedding_disabled")}`,
    `- Removed or private: ${count("removed_or_private")}`,
    `- Failed: ${count("failed")}`,
    `- Needs manual check: ${count("needs_manual_check")}`,
    `- Title or author mismatches: ${mismatches.length}`,
    "",
    "## Failed or needs manual check",
    "",
    problems.length > 0 ? problems.map(bulletLink).join("\n\n") : "None.",
    "",
    "## Title and author mismatches",
    "",
  ];

  if (mismatches.length === 0) sections.push("None.", "");
  else {
    for (const item of mismatches) {
      sections.push(`### Stage ${item.stageOrder}.${item.resource.order} — ${item.resource.title}`, "");
      sections.push(`- Link: ${item.resource.url}`);
      for (const mismatch of item.mismatches) {
        sections.push(`- ${mismatch.label}: catalog "${mismatch.catalog}" / YouTube "${mismatch.found}"`);
      }
      sections.push("");
    }
  }

  sections.push("## Needs review checklist", "");
  if (reviews.length === 0) sections.push("None.", "");
  else {
    for (const item of reviews) {
      sections.push(`- [ ] Stage ${item.stageOrder}.${item.resource.order} — ${item.resource.title}`);
      sections.push(`  - ${item.resource.url}`);
      sections.push(`  - ${outcomeText(item.outcome)}`);
    }
    sections.push("");
  }

  return `${sections.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

type StoredResource = {
  id: string;
  stageOrder: number;
  stageTitle: string;
  order: number;
  type: string;
  url: string;
  title: string;
  provider: string;
  author: string | null;
  videoId: string | null;
  sourceStatus: "ACTIVE" | "UNAVAILABLE";
};

async function readStoredCatalog(slug: string) {
  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: {
      name: true,
      stages: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          title: true,
          resources: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              type: true,
              url: true,
              title: true,
              provider: true,
              author: true,
              videoId: true,
              sourceStatus: true,
            },
          },
        },
      },
    },
  });
  if (!skill) throw new Error(`No skill named ${slug}.`);
  const resources: StoredResource[] = skill.stages.flatMap((stage) =>
    stage.resources.map((resource) => ({
      id: resource.id,
      stageOrder: stage.order,
      stageTitle: stage.title,
      order: resource.order,
      type: resource.type,
      url: resource.url,
      title: resource.title,
      provider: resource.provider,
      author: resource.author,
      videoId: resource.videoId,
      sourceStatus: resource.sourceStatus,
    })),
  );
  return { name: skill.name, resources };
}

function fromDbMarkdown(
  slug: string,
  fileName: string,
  skillName: string,
  checked: { resource: StoredResource; outcome: LinkOutcome; nextStatus: "ACTIVE" | "UNAVAILABLE" }[],
) {
  const checkedOn = new Date().toISOString().slice(0, 10);
  const unavailable = checked.filter((item) => item.nextStatus === "UNAVAILABLE");
  const manual = checked.filter((item) => item.outcome.kind === "needs_manual_check");
  const lines = [
    `# Stored link check: ${fileName}`,
    "",
    `Checked ${checkedOn} for skill \`${slug}\` (${skillName}). ${checked.length} stored resources.`,
    "A removed, private, failed, or non-embeddable source is marked unavailable. The saved title and notes stay.",
    "A link that needs a person to look at it is left unchanged.",
    "",
    "## Summary",
    "",
    `- Unavailable: ${unavailable.length}`,
    `- Needs a person to check: ${manual.length}`,
    `- Still available: ${checked.filter((item) => item.nextStatus === "ACTIVE").length}`,
    "",
    "## Marked unavailable",
    "",
    unavailable.length === 0
      ? "None."
      : unavailable
          .map(
            (item) =>
              `- Stage ${item.resource.stageOrder}.${item.resource.order} — ${item.resource.title}: ${outcomeText(item.outcome)}`,
          )
          .join("\n"),
    "",
    "## Needs a person to check",
    "",
    manual.length === 0
      ? "None."
      : manual
          .map(
            (item) =>
              `- Stage ${item.resource.stageOrder}.${item.resource.order} — ${item.resource.title}: ${outcomeText(item.outcome)}`,
          )
          .join("\n"),
    "",
  ];
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

/** Check the resources stored for a skill. Fatal links are marked unavailable. */
export async function verifyStoredCatalog(slug: string) {
  const { fileName } = catalogFile(slug);
  const { name, resources } = await readStoredCatalog(slug);
  if (resources.length === 0) throw new Error(`${slug} has no stored resources to check.`);
  console.log(`Checking ${resources.length} stored resources for ${slug}.`);

  const checked: { resource: StoredResource; outcome: LinkOutcome; nextStatus: "ACTIVE" | "UNAVAILABLE" }[] = [];
  for (let index = 0; index < resources.length; index += 1) {
    if (index > 0) await sleep(DELAY_MS);
    const resource = resources[index];
    const result = await checkCatalogLink(resource);
    const nextStatus = isFatalLink(result.outcome)
      ? "UNAVAILABLE"
      : result.outcome.kind === "ok"
        ? "ACTIVE"
        : resource.sourceStatus;
    checked.push({ resource, outcome: result.outcome, nextStatus });
    const change = nextStatus === resource.sourceStatus ? "unchanged" : nextStatus === "UNAVAILABLE" ? "unavailable" : "available again";
    console.log(`${index + 1}/${resources.length} ${resource.stageOrder}.${resource.order} ${outcomeText(result.outcome)} — ${change}`);
  }

  const remote = checked.filter((item) => !item.resource.url.startsWith("/uploads/"));
  const neverReached = remote.filter((item) => item.outcome.kind === "failed" && item.outcome.status === null);
  if (remote.length > 0 && neverReached.length === remote.length) {
    throw new Error("Every link failed before a response. Nothing was marked unavailable.");
  }

  const checkedAt = new Date();
  await prisma.$transaction(
    checked.map((item) =>
      prisma.resource.update({
        where: { id: item.resource.id },
        data: {
          lastVerifiedAt: checkedAt,
          ...(item.nextStatus === item.resource.sourceStatus ? {} : { sourceStatus: item.nextStatus }),
        },
      }),
    ),
  );

  const reviewDir = path.join(process.cwd(), "content", "catalog", "_review");
  await mkdir(reviewDir, { recursive: true });
  const reviewPath = path.join(reviewDir, `${fileName}.from-db.md`);
  await writeFile(reviewPath, fromDbMarkdown(slug, fileName, name, checked));
  const unavailable = checked.filter((item) => item.nextStatus === "UNAVAILABLE").length;
  console.log(`Marked ${unavailable} unavailable. Wrote ${path.relative(process.cwd(), reviewPath)}`);
  return reviewPath;
}

export async function verifyCatalog(slug: string) {
  const { fileName, catalog } = await readCatalog(slug);
  console.log(`Checking ${catalog.stages.reduce((sum, stage) => sum + stage.resources.length, 0)} resources in ${fileName}.json`);
  const checked = await checkCatalog(catalog);
  const markdown = reportMarkdown(slug, fileName, catalog, checked);
  const reviewDir = path.join(process.cwd(), "content", "catalog", "_review");
  await mkdir(reviewDir, { recursive: true });
  const reviewPath = path.join(reviewDir, `${fileName}.md`);
  await writeFile(reviewPath, markdown);
  console.log(`Wrote ${path.relative(process.cwd(), reviewPath)}`);
  return reviewPath;
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

if (isDirectRun()) {
  const args = process.argv.slice(2);
  const fromDb = args.includes("--from-db");
  const slug = args.find((arg) => !arg.startsWith("--"));
  if (!slug) {
    console.error("Usage: npx tsx scripts/verify-catalog.ts <skill-slug> [--from-db]");
    process.exit(1);
  }
  const run = fromDb ? verifyStoredCatalog(slug) : verifyCatalog(slug);
  run
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
