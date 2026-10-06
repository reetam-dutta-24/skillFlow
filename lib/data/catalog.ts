import "server-only";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { loadCachedStageResources, loadPublicCatalog, type PublicCatalogEntry, type PublicStage } from "@/lib/data/public-catalog";
import { prisma } from "@/lib/prisma";
import { masteryShare } from "@/lib/progress/formula";
import { SEQUENCE_LOCK, stageOpenForLearner } from "@/lib/progress/sequence";
import type { ResourceView, RoadmapStageView, SkillView, StageStatus } from "@/lib/types/domain";

export type CatalogEntry = {
  skill: SkillView;
  stages: RoadmapStageView[];
};

type SkillProgress = { currentStageOrder: number };
type Completion = { explainBackPassed: boolean };

type ViewerProgress = {
  skills: Map<string, SkillProgress>;
  completions: Map<string, Completion>;
};

const EMPTY_PROGRESS: ViewerProgress = { skills: new Map(), completions: new Map() };

async function viewerProgress(userId: string): Promise<ViewerProgress> {
  const [skills, completions] = await Promise.all([
    prisma.userSkillProgress.findMany({
      where: { userId },
      select: { skillId: true, currentStageOrder: true },
    }),
    prisma.stageCompletion.findMany({
      where: { userId },
      select: { stageId: true, explainBackPassed: true },
    }),
  ]);
  return {
    skills: new Map(
      skills.map((row) => [row.skillId, { currentStageOrder: row.currentStageOrder }]),
    ),
    completions: new Map(
      completions.map((row) => [row.stageId, { explainBackPassed: row.explainBackPassed }]),
    ),
  };
}

function applyStage(
  stage: PublicStage,
  completion: Completion | undefined,
  currentOrder: number | undefined,
  reached: boolean,
): RoadmapStageView {
  // The explain-back is the mastery check. A later stage stays shut until the earlier ones are passed.
  const passed = Boolean(completion?.explainBackPassed);
  const open = stage.open && reached;
  let status: StageStatus = "locked";
  if (open && passed) status = "passed";
  else if (open && stage.order === currentOrder) status = "in_progress";
  else if (open) status = "ready";
  return {
    id: stage.id,
    skillId: stage.skillId,
    title: stage.title,
    description: open ? stage.description : stage.open ? SEQUENCE_LOCK : stage.description,
    image: stage.image,
    order: stage.order,
    status,
    masteryPercent: status === "passed" ? 100 : 0,
    lessonCount: open ? stage.lessonCount : 0,
    hasExplainBack: open && stage.hasExplainBack,
    explainBackPassed: open && passed,
    previousStageTitle: stage.previousStageTitle,
  };
}

function applyEntry(entry: PublicCatalogEntry, progress: ViewerProgress): CatalogEntry {
  const skillProgress = progress.skills.get(entry.skill.id);
  const openStages = entry.stages.filter((stage) => stage.open);
  const openOrders = openStages.map((stage) => stage.order);
  const progressOrder = skillProgress?.currentStageOrder ?? openOrders[0] ?? 1;
  const currentOrder = openOrders.includes(progressOrder) ? progressOrder : openOrders[0];
  const passedIds = new Set(
    entry.stages.filter((stage) => progress.completions.get(stage.id)?.explainBackPassed).map((stage) => stage.id),
  );
  const passedOpen = openStages.filter((stage) => passedIds.has(stage.id)).length;
  return {
    skill: {
      ...entry.skill,
      followed: Boolean(skillProgress),
      masteryPercent: masteryShare(passedOpen, openStages.length),
    },
    stages: entry.stages.map((stage, index) =>
      applyStage(stage, progress.completions.get(stage.id), currentOrder, stageOpenForLearner(entry.stages, index, passedIds)),
    ),
  };
}

/** Shared niches and stages, plus this learner's follow and pass marks. */
export const loadCatalog = cache(async (): Promise<CatalogEntry[]> => {
  const session = await auth();
  const userId = session?.user?.id;
  const [shared, progress] = await Promise.all([
    loadPublicCatalog(),
    userId ? viewerProgress(userId) : Promise.resolve(EMPTY_PROGRESS),
  ]);
  return shared.map((entry) => applyEntry(entry, progress));
});

export async function loadStageResources(stageId: string): Promise<ResourceView[]> {
  return loadCachedStageResources(stageId);
}

export async function loadFollowedSkillIds(userId: string): Promise<string[]> {
  const rows = await prisma.userSkillProgress.findMany({
    where: { userId },
    select: { skillId: true },
  });
  return rows.map((row) => row.skillId);
}
