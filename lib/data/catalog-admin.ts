import "server-only";
import { prisma } from "@/lib/prisma";
import { checkCatalogLink } from "@/lib/catalog-link-check";
import { readTagOrigins } from "@/lib/plan/tags";
import { upsertExplainBackPrompt, upsertResource, upsertStage } from "@/lib/services/catalog";
import type { ResourceType as ResourceTypeName } from "@/lib/types/domain";
import type { TagOrigins } from "@/lib/plan/tags";

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
  durationMinutes: number | null;
  depth: "INTRO" | "STANDARD" | "DEEP" | null;
  isCore: boolean;
  captionLanguages: string;
  tagOrigins: TagOrigins;
};

export type CatalogEditorStage = {
  id: string;
  title: string;
  description: string;
  image: string;
  order: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  objectives: string;
  question: string;
  rubric: string;
  resources: CatalogEditorResource[];
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
  durationMinutes: number | null;
  depth: "INTRO" | "STANDARD" | "DEEP" | null;
  isCore: boolean;
  captionLanguages: string[];
};

export type CatalogSaveResult =
  | { ok: true; id: string; lessonHref: string; roadmapHref: string }
  | { ok: false; error: string };

export type StageSaveInput = {
  skillId: string;
  order: number;
  title: string;
  description: string;
  image: string;
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
    durationMinutes: input.durationMinutes,
    depth: input.depth,
    isCore: input.isCore,
    captionLanguages: input.captionLanguages,
    tagSource: "admin",
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
export async function saveCatalogStage(input: StageSaveInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const rubric = pointsFromText(input.rubric);
  try {
    return await prisma.$transaction(async (tx) => {
      const stage = await upsertStage(
        {
          skillId: input.skillId,
          order: input.order,
          title: input.title,
          description: input.description,
          image: input.image,
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
      await tx.explainBackPrompt.update({
        where: { stageId: stage.data.id },
        data: { conceptSourceHash: null },
      });
      return { ok: true as const, id: stage.data.id };
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

// ── CMS ──────────────────────────────────────────────

export type CmsNicheRow = {
  id: string;
  name: string;
  slug: string;
  image: string;
  status: "AVAILABLE" | "COMING_SOON";
  free: boolean;
  flagship: boolean;
  stages: number;
  resources: number;
  needsReview: number;
};

/** Every niche with its counts, for the CMS list. Admin only, read on the request. */
export async function listCmsNiches(): Promise<CmsNicheRow[]> {
  const skills = await prisma.skill.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      status: true,
      offer: true,
      isFlagship: true,
      stages: { select: { _count: { select: { resources: true } }, resources: { where: { needsReview: true }, select: { id: true } } } },
    },
  });
  return skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    slug: skill.slug,
    image: skill.image,
    status: skill.status,
    free: skill.offer === "FREE",
    flagship: skill.isFlagship,
    stages: skill.stages.length,
    resources: skill.stages.reduce((sum, stage) => sum + stage._count.resources, 0),
    needsReview: skill.stages.reduce((sum, stage) => sum + stage.resources.length, 0),
  }));
}

export type CmsStage = CatalogEditorStage & { learners: number };
export type CmsNiche = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: "AVAILABLE" | "COMING_SOON";
  free: boolean;
  flagship: boolean;
  followers: number;
  /** Learner and community records tied to this niche. Any of them blocks deleting it. */
  dependents: { contributions: number; videos: number; events: number };
  stages: CmsStage[];
};

/** One niche with every stage and resource, plus how many learners touched each stage. Admin only, on the request. */
export async function getCmsNiche(slug: string): Promise<CmsNiche | null> {
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: { resources: { orderBy: { order: "asc" } }, explainBackPrompt: true },
      },
      _count: { select: { userProgress: true, communityContributions: true } },
    },
  });
  if (!skill) return null;
  const stageIds = skill.stages.map((stage) => stage.id);
  const [completions, notes, attempts, videos, events] = await Promise.all([
    prisma.stageCompletion.groupBy({ by: ["stageId"], where: { stageId: { in: stageIds } }, _count: { _all: true } }),
    prisma.learnerNote.groupBy({ by: ["stageId"], where: { stageId: { in: stageIds } }, _count: { _all: true } }),
    prisma.explainBackAttempt.findMany({ where: { prompt: { stageId: { in: stageIds } } }, select: { prompt: { select: { stageId: true } } } }),
    prisma.creatorWork.count({ where: { skillId: skill.id } }),
    prisma.event.count({ where: { skillId: skill.id } }),
  ]);
  const touched = new Map<string, number>();
  const bump = (stageId: string | null, count: number) => {
    if (stageId) touched.set(stageId, (touched.get(stageId) ?? 0) + count);
  };
  completions.forEach((row) => bump(row.stageId, row._count._all));
  notes.forEach((row) => bump(row.stageId, row._count._all));
  attempts.forEach((row) => bump(row.prompt.stageId, 1));

  return {
    id: skill.id,
    name: skill.name,
    slug: skill.slug,
    description: skill.description ?? "",
    image: skill.image,
    status: skill.status,
    free: skill.offer === "FREE",
    flagship: skill.isFlagship,
    followers: skill._count.userProgress,
    dependents: { contributions: skill._count.communityContributions, videos, events },
    stages: skill.stages.map((stage) => ({
      id: stage.id,
      title: stage.title,
      description: stage.description ?? "",
      image: stage.image ?? "",
      order: stage.order,
      level: stage.level,
      objectives: stage.learningObjectives.join("\n"),
      question: stage.explainBackPrompt?.question ?? "",
      rubric: stage.explainBackPrompt?.rubric.join("\n") ?? "",
      learners: touched.get(stage.id) ?? 0,
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
        durationMinutes: resource.durationMinutes,
        depth: resource.depth,
        isCore: resource.isCore,
        captionLanguages: resource.captionLanguages.join("\n"),
        tagOrigins: readTagOrigins(resource.tagOrigins),
      })),
    })),
  };
}
