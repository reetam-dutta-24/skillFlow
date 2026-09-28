import "server-only";
import { QUIZ_GENERATION_FAILURE_STAGE_ID, QUIZ_PASS_THRESHOLD } from "@/lib/mock/config";
import { devDelay } from "@/lib/mock/delay";
import { findQuiz, findStage } from "@/lib/mock/catalog";
import type { QuizData } from "@/lib/types/pages";

export { QUIZ_PASS_THRESHOLD };

export async function getQuiz(stageId: string): Promise<QuizData | null> {
  await devDelay();
  if (stageId === QUIZ_GENERATION_FAILURE_STAGE_ID) return { kind: "unavailable" };
  const found = findStage(stageId);
  if (!found) return null;
  if (found.stage.status === "locked") return { kind: "locked", skillSlug: found.skill.slug };
  const quiz = findQuiz(stageId);
  if (!quiz) return null;
  return { kind: "ready", skill: found.skill, stage: found.stage, quiz };
}
