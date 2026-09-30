import "server-only";
import { cache } from "react";
import type { Prisma, Resource } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ResourceView, RoadmapStageView, SkillView, StageStatus } from "@/lib/types/domain";

/** On a free path, this many stages at the end stay locked. */
const LOCKED_TAIL = 3;
const LOCKED_PREVIEW = "This part of the path stays locked.";

const ANONYMOUS = "__anonymous__";

function catalogInclude(userId: string) {
  return {
    userProgress: {
      where: { userId },
      select: { masteryPercent: true, currentStageOrder: true },
    },
    stages: {
      orderBy: { order: "asc" as const },
      include: {
        _count: { select: { resources: true } },
        quiz: { select: { id: true } },
        explainBackPrompt: { select: { id: true } },
        stageCompletions: {
          where: { userId },
          select: { quizPassed: true, explainBackPassed: true },
        },
      },
    },
  } satisfies Prisma.SkillInclude;
}

type CatalogSkill = Prisma.SkillGetPayload<{ include: ReturnType<typeof catalogInclude> }>;
type CatalogStage = CatalogSkill["stages"][number];

export type CatalogEntry = {
  skill: SkillView;
  stages: RoadmapStageView[];
};

function skillStatus(status: CatalogSkill["status"]): SkillView["status"] {
  return status === "AVAILABLE" ? "available" : "coming_soon";
}

function openLimit(stageCount: number) {
  if (stageCount <= 1) return stageCount;
  return Math.max(1, stageCount - LOCKED_TAIL);
}

function stageIsOpen(skill: CatalogSkill, stage: CatalogStage, limit: number) {
  if (skill.status !== "AVAILABLE" || skill.offer !== "FREE") return false;
  if (stage.monetized) return false;
  return stage.order <= limit;
}

function toSkill(skill: CatalogSkill): SkillView {
  const progress = skill.userProgress[0];
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    image: skill.image,
    isFlagship: skill.isFlagship,
    order: skill.order,
    status: skillStatus(skill.status),
    offer: skill.offer,
    followed: Boolean(progress),
    masteryPercent: Math.round(progress?.masteryPercent ?? 0),
    createdAt: skill.createdAt.toISOString(),
  };
}

function toStages(skill: CatalogSkill): RoadmapStageView[] {
  const limit = openLimit(skill.stages.length);
  const openOrders = skill.stages.filter((stage) => stageIsOpen(skill, stage, limit)).map((stage) => stage.order);
  const progressOrder = skill.userProgress[0]?.currentStageOrder ?? openOrders[0] ?? 1;
  const currentOrder = openOrders.includes(progressOrder) ? progressOrder : openOrders[0];
  return skill.stages.map((stage, index) => toStage(stage, index, skill.stages, stageIsOpen(skill, stage, limit), currentOrder));
}

function toStage(
  stage: CatalogStage,
  index: number,
  stages: CatalogStage[],
  open: boolean,
  currentOrder: number | undefined,
): RoadmapStageView {
  const completion = stage.stageCompletions[0];
  const passed = Boolean(completion?.quizPassed && completion.explainBackPassed);
  let status: StageStatus = "locked";
  if (open && passed) status = "passed";
  else if (open && stage.order === currentOrder) status = "in_progress";
  else if (open) status = "ready";
  return {
    id: stage.id,
    skillId: stage.skillId,
    title: stage.title,
    description: open ? stage.description : LOCKED_PREVIEW,
    image: stage.image,
    order: stage.order,
    status,
    masteryPercent: status === "passed" ? 100 : 0,
    lessonCount: open ? stage._count.resources : 0,
    hasQuiz: open && Boolean(stage.quiz),
    hasExplainBack: open && Boolean(stage.explainBackPrompt),
    quizPassed: open && Boolean(completion?.quizPassed),
    explainBackPassed: open && Boolean(completion?.explainBackPassed),
    previousStageTitle: index > 0 ? stages[index - 1].title : null,
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

async function viewer() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { userId: ANONYMOUS };
  return { userId };
}

/** Skills, stages, and this learner's open window. Resources are loaded per lesson. */
export const loadCatalog = cache(async (): Promise<CatalogEntry[]> => {
  const { userId } = await viewer();
  const skills = await prisma.skill.findMany({
    orderBy: { order: "asc" },
    include: catalogInclude(userId),
  });
  return skills.map((skill) => ({
    skill: toSkill(skill),
    stages: toStages(skill),
  }));
});

export async function loadStageResources(stageId: string): Promise<ResourceView[]> {
  const rows = await prisma.resource.findMany({
    where: { stageId },
    orderBy: { order: "asc" },
  });
  return rows.map(toResource);
}
