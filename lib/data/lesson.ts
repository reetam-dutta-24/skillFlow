import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { findStage, listResources } from "@/lib/mock/catalog";
import type { LessonData } from "@/lib/types/pages";

export async function getLesson(stageId: string): Promise<LessonData | null> {
  await devDelay();
  const found = findStage(stageId);
  if (!found) return null;
  const { skill, stage } = found;
  if (stage.status === "locked") {
    return {
      kind: "locked",
      skillSlug: skill.slug,
      skillName: skill.name,
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
}
