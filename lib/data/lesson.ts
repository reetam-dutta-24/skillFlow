import "server-only";
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cache/tags";
import { loadCachedStageResources, loadPublicCatalog, type PublicCatalogEntry, type PublicStage } from "@/lib/data/public-catalog";
import type { RoadmapStageView, SkillView, StageStatus } from "@/lib/types/domain";
import type { LessonData } from "@/lib/types/pages";

function toSkill(entry: PublicCatalogEntry): SkillView {
  return { ...entry.skill, followed: false, masteryPercent: 0 };
}

function toStage(stage: PublicStage): RoadmapStageView {
  const status: StageStatus = stage.open ? "ready" : "locked";
  return {
    id: stage.id,
    skillId: stage.skillId,
    title: stage.title,
    description: stage.description,
    image: stage.image,
    order: stage.order,
    status,
    masteryPercent: 0,
    lessonCount: stage.lessonCount,
    hasQuiz: stage.hasQuiz,
    hasExplainBack: stage.hasExplainBack,
    quizPassed: false,
    explainBackPassed: false,
    previousStageTitle: stage.previousStageTitle,
  };
}

/** One lesson body for every learner. The lock is the free-path tail, not a personal pass. */
export async function loadPublicLesson(stageId: string): Promise<LessonData | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const catalog = await loadPublicCatalog();
  const entry = catalog.find((item) => item.stages.some((stage) => stage.id === stageId));
  const stage = entry?.stages.find((item) => item.id === stageId);
  if (!entry || !stage) return null;

  if (!stage.open) {
    return {
      kind: "locked",
      skillSlug: entry.skill.slug,
      skillName: entry.skill.name,
      stageTitle: stage.title,
      previousStageTitle: stage.previousStageTitle,
    };
  }

  return {
    kind: "open",
    skill: toSkill(entry),
    stage: toStage(stage),
    resources: await loadCachedStageResources(stage.id),
    quizHref: stage.hasQuiz ? `/quiz/${stage.id}` : null,
  };
}

export const getLesson = cache(async (stageId: string): Promise<LessonData | null> => loadPublicLesson(stageId));
