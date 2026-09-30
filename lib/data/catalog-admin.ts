import "server-only";
import { prisma } from "@/lib/prisma";
import { checkCatalogLink } from "@/lib/catalog-link-check";
import { upsertExplainBackPrompt, upsertResource, upsertStage } from "@/lib/services/catalog";
import type { ResourceType as ResourceTypeName } from "@/lib/types/domain";

export type CatalogEditorResource = {
  id: string;
  stageId: string;
  type: ResourceTypeName;
  url: string;
  title: string;
  description: string;
  keyPoints: string;
  transcript: string;
  provider: string;
  author: string;
  videoId: string;
  isFree: boolean;
  language: string;
  sourceStatus: "ACTIVE" | "UNAVAILABLE";
  needsReview: boolean;
  lastVerifiedAt: string | null;
  order: number;
};

export type CatalogEditorStage = {
  id: string;
  title: string;
  description: string;
  order: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  objectives: string;
  question: string;
  rubric: string;
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
  transcript: string;
  provider: string;
  author: string;
  videoId: string;
  isFree: boolean;
  language: string;
  sourceStatus: string;
  needsReview: boolean;
};

export type CatalogSaveResult =
  | { ok: true; id: string; lessonHref: string; roadmapHref: string }
  | { ok: false; error: string };

export type StageSaveInput = {
  skillId: string;
  order: number;
  title: string;
  description: string;
  level: string;
  objectives: string;
  question: string;
  rubric: string;
};

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
        include: {
          resources: { orderBy: { order: "asc" } },
          explainBackPrompt: true,
        },
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
        description: stage.description ?? "",
        order: stage.order,
        level: stage.level,
        objectives: stage.learningObjectives.join("\n"),
        question: stage.explainBackPrompt?.question ?? "",
        rubric: stage.explainBackPrompt?.rubric.join("\n") ?? "",
        resources: stage.resources.map((resource) => ({
          id: resource.id,
          stageId: resource.stageId,
          type: resource.type,
          url: resource.url,
          title: resource.title,
          description: resource.description ?? "",
          keyPoints: resource.keyPoints.join("\n"),
          transcript: resource.transcript ?? "",
          provider: resource.provider,
          author: resource.author ?? "",
          videoId: resource.videoId ?? "",
          isFree: resource.isFree,
          language: resource.language,
          sourceStatus: resource.sourceStatus,
          needsReview: resource.needsReview,
          lastVerifiedAt: resource.lastVerifiedAt?.toISOString() ?? null,
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
    transcript: input.transcript,
    provider: input.provider,
    author: input.author,
    videoId: input.videoId,
    isFree: input.isFree,
    language: input.language,
    sourceStatus: input.sourceStatus,
    needsReview: input.needsReview,
  });
  if (!saved.ok) return saved;
  return {
    ok: true,
    id: saved.data.id,
    lessonHref: `/lesson/${saved.data.stageId}`,
    roadmapHref: `/roadmap/${saved.data.skillSlug}`,
  };
}

/** Update a stage and its explain-back prompt together. Caller must already be an admin. */
export async function saveCatalogStage(input: StageSaveInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const rubric = pointsFromText(input.rubric);
  try {
    return await prisma.$transaction(async (tx) => {
      const stage = await upsertStage(
        {
          skillId: input.skillId,
          order: input.order,
          title: input.title,
          description: input.description,
          level: input.level,
          learningObjectives: pointsFromText(input.objectives),
        },
        tx,
      );
      if (!stage.ok) return stage;
      const prompt = await upsertExplainBackPrompt(
        { stageId: stage.data.id, question: input.question, rubric },
        tx,
      );
      if (!prompt.ok) throw new Error(prompt.error);
      return { ok: true as const };
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "The stage could not be saved. Try again." };
  }
}

/** Clear the review flag on one resource. Caller must already be an admin. */
export async function markCatalogResourceReviewed(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.resource.findUnique({
    where: { id },
    select: { id: true, stageId: true, type: true, url: true, title: true },
  });
  if (!row) return { ok: false, error: "That resource is no longer there." };
  const saved = await upsertResource({ ...row, needsReview: false });
  if (!saved.ok) return saved;
  return { ok: true };
}

/** Re-check one stored link and stamp when it was checked. Caller must already be an admin. */
export async function recheckCatalogResource(
  id: string,
): Promise<{ ok: true; summary: string; checkedAt: string } | { ok: false; error: string }> {
  const row = await prisma.resource.findUnique({
    where: { id },
    select: {
      id: true,
      stageId: true,
      type: true,
      url: true,
      title: true,
      provider: true,
      author: true,
      videoId: true,
    },
  });
  if (!row) return { ok: false, error: "That resource is no longer there." };
  const checked = await checkCatalogLink(row);
  const checkedAt = new Date();
  const saved = await upsertResource({
    id: row.id,
    stageId: row.stageId,
    type: row.type,
    url: row.url,
    title: row.title,
    lastVerifiedAt: checkedAt,
  });
  if (!saved.ok) return saved;
  return { ok: true, summary: checked.summary, checkedAt: checkedAt.toISOString() };
}

export type CatalogSkillRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  open: boolean;
  status: "AVAILABLE" | "COMING_SOON";
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
    status: skill.status,
  }));
}
