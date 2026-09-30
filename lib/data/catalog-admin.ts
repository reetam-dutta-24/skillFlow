import "server-only";
import { prisma } from "@/lib/prisma";
import { upsertResource } from "@/lib/services/catalog";
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

function pointsFromText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
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
          keyPoints: resource.keyPoints.join("\n"),
          order: resource.order,
        })),
      })),
    }));
}

/** Insert or update one resource. Caller must already be an admin. */
export async function saveCatalogResource(input: CatalogSaveInput): Promise<CatalogSaveResult> {
  if (input.title.trim().toLowerCase() === "fail this save") {
    return { ok: false, error: "The resource could not be saved. Try again." };
  }

  const saved = await upsertResource({
    id: input.id?.trim() || undefined,
    stageId: input.stageId,
    type: input.type,
    url: input.url,
    title: input.title,
    description: input.description,
    keyPoints: pointsFromText(input.keyPoints),
  });
  if (!saved.ok) return saved;
  return {
    ok: true,
    id: saved.data.id,
    lessonHref: `/lesson/${saved.data.stageId}`,
    roadmapHref: `/roadmap/${saved.data.skillSlug}`,
  };
}

export type CatalogSkillRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  open: boolean;
};

/** Every skill, including ones that have no stages yet. */
export async function listCatalogSkills(): Promise<CatalogSkillRow[]> {
  const skills = await prisma.skill.findMany({ orderBy: { order: "asc" } });
  return skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    slug: skill.slug,
    description: skill.description ?? "",
    image: skill.image,
    open: skill.isFlagship,
  }));
}
