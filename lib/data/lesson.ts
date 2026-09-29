import "server-only";
import { cache } from "react";
import { loadCatalog, loadStageResources } from "@/lib/data/catalog";
import type { LessonData } from "@/lib/types/pages";

export const getLesson = cache(async (stageId: string): Promise<LessonData | null> => {
  const catalog = await loadCatalog();
  const entry = catalog.find((item) => item.stages.some((stage) => stage.id === stageId));
  const stage = entry?.stages.find((item) => item.id === stageId);
  if (!entry || !stage) return null;

  if (stage.status === "locked") {
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
    skill: entry.skill,
    stage,
    resources: await loadStageResources(stage.id),
    quizHref: stage.hasQuiz ? `/quiz/${stage.id}` : null,
  };
});
