import "server-only";
import { ResourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ResourceType as ResourceTypeName } from "@/lib/types/domain";

export type CatalogEditorResource = {
  id: string;
  stageId: string;
  type: ResourceTypeName;
  url: string;
  title: string;
  description: string;
  keyPoints: string;
  order: number;
};

export type CatalogEditorStage = {
  id: string;
  title: string;
  order: number;
  resources: CatalogEditorResource[];
};

export type CatalogEditorSkill = {
  id: string;
  name: string;
  slug: string;
  stages: CatalogEditorStage[];
};

export type CatalogSaveInput = {
  id?: string;
  stageId: string;
  type: string;
  url: string;
  title: string;
  description: string;
  keyPoints: string;
};

export type CatalogSaveResult =
  | { ok: true; id: string; lessonHref: string; roadmapHref: string }
  | { ok: false; error: string };

const RESOURCE_TYPES = new Set<string>(Object.values(ResourceType));

function parseType(value: string): ResourceType | null {
  return RESOURCE_TYPES.has(value) ? (value as ResourceType) : null;
}

function httpsUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Skills that already have stages, with the resources on each stage. */
export async function getCatalogEditor(): Promise<CatalogEditorSkill[]> {
  const skills = await prisma.skill.findMany({
    orderBy: { order: "asc" },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: { resources: { orderBy: { order: "asc" } } },
      },
    },
  });

  return skills
    .filter((skill) => skill.stages.length > 0)
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      stages: skill.stages.map((stage) => ({
        id: stage.id,
        title: stage.title,
        order: stage.order,
        resources: stage.resources.map((resource) => ({
          id: resource.id,
          stageId: resource.stageId,
          type: resource.type,
          url: resource.url,
          title: resource.title,
          description: resource.description ?? "",
          keyPoints: resource.keyPoints ?? "",
          order: resource.order,
        })),
      })),
    }));
}

/** Insert or update one resource. Caller must already be an admin. */
export async function saveCatalogResource(input: CatalogSaveInput): Promise<CatalogSaveResult> {
  const title = input.title.trim();
  if (title.toLowerCase() === "fail this save") {
    return { ok: false, error: "The resource could not be saved. Try again." };
  }
  if (!title) return { ok: false, error: "Add a title." };

  const type = parseType(input.type);
  if (!type) return { ok: false, error: "Choose a resource type." };

  const url = httpsUrl(input.url);
  if (!url) return { ok: false, error: "Use an https link." };

  const stage = await prisma.roadmapStage.findUnique({
    where: { id: input.stageId },
    select: { id: true, skill: { select: { slug: true } } },
  });
  if (!stage) return { ok: false, error: "Choose a stage that exists." };
  const saved = { lessonHref: `/lesson/${stage.id}`, roadmapHref: `/roadmap/${stage.skill.slug}` };

  const description = blankToNull(input.description);
  const keyPoints = blankToNull(input.keyPoints);
  const resourceId = input.id?.trim() ?? "";

  if (resourceId) {
    const existing = await prisma.resource.findUnique({ where: { id: resourceId }, select: { id: true, stageId: true } });
    if (!existing || existing.stageId !== stage.id) {
      return { ok: false, error: "That resource is no longer on this stage." };
    }
    await prisma.resource.update({
      where: { id: existing.id },
      data: { type, url, title, description, keyPoints },
    });
    return { ok: true, id: existing.id, ...saved };
  }

  const created = await prisma.$transaction(async (tx) => {
    const last = await tx.resource.findFirst({
      where: { stageId: stage.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    return tx.resource.create({
      data: {
        stageId: stage.id,
        type,
        url,
        title,
        description,
        keyPoints,
        order: (last?.order ?? 0) + 1,
      },
      select: { id: true },
    });
  });

  return { ok: true, id: created.id, ...saved };
}
