import "server-only";
import type { Prisma, Resource } from "@prisma/client";
import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { openStageLimit } from "@/lib/progress/formula";
import type { ResourceView, SkillOffer, SkillStatus } from "@/lib/types/domain";

const LOCKED_PREVIEW = "This stage is not open yet.";

const publicInclude = {
  stages: {
    orderBy: { order: "asc" as const },
    include: {
      _count: { select: { resources: true } },
      explainBackPrompt: { select: { id: true } },
    },
  },
} satisfies Prisma.SkillInclude;

type PublicRow = Prisma.SkillGetPayload<{ include: typeof publicInclude }>;

export type PublicStage = {
  id: string;
  skillId: string;
  title: string;
  description: string | null;
  image: string | null;
  order: number;
  open: boolean;
  lessonCount: number;
  hasExplainBack: boolean;
  previousStageTitle: string | null;
};

export type PublicSkill = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string;
  isFlagship: boolean;
  order: number;
  status: SkillStatus;
  offer: SkillOffer;
  createdAt: string;
};

export type PublicCatalogEntry = {
  skill: PublicSkill;
  stages: PublicStage[];
};

export type SubmitSkillOption = {
  id: string;
  slug: string;
  name: string;
  image: string;
  stages: { id: string; title: string }[];
};

function skillStatus(status: PublicRow["status"]): SkillStatus {
  return status === "AVAILABLE" ? "available" : "coming_soon";
}

function stageIsOpen(skill: PublicRow, stage: PublicRow["stages"][number], limit: number) {
  if (skill.status !== "AVAILABLE" || skill.offer !== "FREE") return false;
  if (stage.monetized) return false;
  return stage.order <= limit;
}

function toEntry(skill: PublicRow): PublicCatalogEntry {
  const limit = openStageLimit(skill.stages.length);
  return {
    skill: {
      id: skill.id,
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      image: skill.image,
      isFlagship: skill.isFlagship,
      order: skill.order,
      status: skillStatus(skill.status),
      offer: skill.offer,
      createdAt: skill.createdAt.toISOString(),
    },
    stages: skill.stages.map((stage, index) => {
      const open = stageIsOpen(skill, stage, limit);
      return {
        id: stage.id,
        skillId: stage.skillId,
        title: stage.title,
        description: open ? stage.description : LOCKED_PREVIEW,
        image: stage.image,
        order: stage.order,
        open,
        lessonCount: open ? stage._count.resources : 0,
        hasExplainBack: open && Boolean(stage.explainBackPrompt),
        previousStageTitle: index > 0 ? skill.stages[index - 1].title : null,
      };
    }),
  };
}

function toResource(row: Resource): ResourceView {
  const unavailable = row.sourceStatus === "UNAVAILABLE";
  return {
    id: row.id,
    stageId: row.stageId,
    type: row.type,
    url: row.url,
    order: row.order,
    title: row.title,
    description: row.description,
    keyPoints: row.keyPoints,
    transcript: unavailable ? null : row.transcript,
    unavailable,
  };
}

/** Niches and stages. One copy for every visitor until an admin changes the catalog. */
export async function loadPublicCatalog(): Promise<PublicCatalogEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const skills = await prisma.skill.findMany({
    orderBy: { order: "asc" },
    include: publicInclude,
  });
  return skills.map(toEntry);
}

/** Lesson sources for one stage. The snapshot is the same for every learner. */
export async function loadCachedStageResources(stageId: string): Promise<ResourceView[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const rows = await prisma.resource.findMany({
    where: { stageId },
    orderBy: { order: "asc" },
  });
  return rows.map(toResource);
}

export async function publicSkillName(slug: string): Promise<string | null> {
  const catalog = await loadPublicCatalog();
  return catalog.find((entry) => entry.skill.slug === slug)?.skill.name ?? null;
}

export async function publicStageTitle(stageId: string): Promise<string | null> {
  const catalog = await loadPublicCatalog();
  for (const entry of catalog) {
    const stage = entry.stages.find((item) => item.id === stageId);
    if (stage) return stage.title;
  }
  return null;
}

/** Flagship skills that already have stages. The submit picker reads this. */
export async function loadSubmitCatalog(): Promise<SubmitSkillOption[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const catalog = await loadPublicCatalog();
  return catalog
    .filter((entry) => entry.skill.isFlagship && entry.stages.length > 0)
    .map((entry) => ({
      id: entry.skill.id,
      slug: entry.skill.slug,
      name: entry.skill.name,
      image: entry.skill.image,
      stages: entry.stages.map((stage) => ({ id: stage.id, title: stage.title })),
    }));
}
