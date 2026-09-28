import "server-only";
import { cache } from "react";
import { devDelay } from "@/lib/mock/delay";
import { findStage, listResources } from "@/lib/mock/catalog";
import type { LessonData } from "@/lib/types/pages";

export const getLesson = cache(async (stageId: string): Promise<LessonData | null> => {
  await devDelay();
  const found = findStage(stageId);
  if (!found) return null;
  const { skill, stage } = found;
  if (stage.status === "locked") {
    return {
      kind: "locked",
      skillSlug: skill.slug,
      skillName: skill.name,
      stageTitle: stage.title,
      previousStageTitle: stage.previousStageTitle,
    };
  }
  return {
    kind: "open",
    skill,
    stage,
    resources: listResources(stage.id),
    quizHref: `/quiz/${stage.id}`,
  };
});
