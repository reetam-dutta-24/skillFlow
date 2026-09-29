import "server-only";
import { cache } from "react";
import type { Prisma, Resource } from "@prisma/client";
import { auth } from "@/lib/auth";
import { openThrough } from "@/lib/learner";
import { prisma } from "@/lib/prisma";
import type { ResourceView, RoadmapStageView, SkillView, StageStatus } from "@/lib/types/domain";

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

/** Flagship skills can be opened. The other seeded skills stay listed as coming soon. */
function skillStatus(isFlagship: boolean): SkillView["status"] {
  return isFlagship ? "available" : "coming_soon";
}

function stageStatus(
  order: number,
  completion: { quizPassed: boolean; explainBackPassed: boolean } | undefined,
  furthestOpen: number,
): StageStatus {
  if (completion?.quizPassed && completion.explainBackPassed) return "passed";
  if (order <= furthestOpen) return "in_progress";
  return "locked";
}

function toSkill(skill: CatalogSkill): SkillView {
  const progress = skill.userProgress[0];
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    isFlagship: skill.isFlagship,
    order: skill.order,
    status: skillStatus(skill.isFlagship),
    followed: Boolean(progress),
    masteryPercent: Math.round(progress?.masteryPercent ?? 0),
    createdAt: skill.createdAt.toISOString(),
  };
}

function toStages(skill: CatalogSkill, pace: string): RoadmapStageView[] {
  const furthestOpen = openThrough(pace, skill.userProgress[0]?.currentStageOrder ?? 1);
  return skill.stages.map((stage, index) => toStage(stage, index, skill.stages, furthestOpen));
}

function toStage(
  stage: CatalogStage,
  index: number,
  stages: CatalogStage[],
  furthestOpen: number,
): RoadmapStageView {
  const completion = stage.stageCompletions[0];
  const status = stageStatus(stage.order, completion, furthestOpen);
  return {
    id: stage.id,
    skillId: stage.skillId,
    title: stage.title,
    description: stage.description,
    order: stage.order,
    status,
    masteryPercent: status === "passed" ? 100 : 0,
    lessonCount: stage._count.resources,
    hasQuiz: Boolean(stage.quiz),
    hasExplainBack: Boolean(stage.explainBackPrompt),
    quizPassed: Boolean(completion?.quizPassed),
    explainBackPassed: Boolean(completion?.explainBackPassed),
    previousStageTitle: index > 0 ? stages[index - 1].title : null,
  };
}

function toResource(row: Resource): ResourceView {
  return {
    id: row.id,
    stageId: row.stageId,
    type: row.type,
    url: row.url,
    order: row.order,
    title: row.title,
    description: row.description,
    keyPoints: row.keyPoints,
    transcript: row.transcript,
    unavailable: false,
  };
}

async function viewer() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { userId: ANONYMOUS, pace: "steady" };
  const profile = await prisma.learnerProfile.findUnique({
    where: { userId },
    select: { pace: true },
  });
  return { userId, pace: profile?.pace ?? "steady" };
}

/** Skills, stages, and this learner's open window. Resources are loaded per lesson. */
export const loadCatalog = cache(async (): Promise<CatalogEntry[]> => {
  const { userId, pace } = await viewer();
  const skills = await prisma.skill.findMany({
    orderBy: { order: "asc" },
    include: catalogInclude(userId),
  });
  return skills.map((skill) => ({
    skill: toSkill(skill),
    stages: toStages(skill, pace),
  }));
});

export async function loadStageResources(stageId: string): Promise<ResourceView[]> {
  const rows = await prisma.resource.findMany({
    where: { stageId },
    orderBy: { order: "asc" },
  });
  return rows.map(toResource);
}
