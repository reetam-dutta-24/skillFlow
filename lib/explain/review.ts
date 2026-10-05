import "server-only";
import { EXPLAIN_REVIEW_FAILURE_TEXT } from "@/lib/mock/config";
import { prisma } from "@/lib/prisma";
import type { ExplainReview } from "@/lib/types/pages";
import { gradeWithModel } from "@/lib/explain/model";
import { recordExplainBack } from "@/lib/explain/record";
import { coverRubric, feedbackFor, followUpFor, passesRubric, quoteFromAnswer } from "@/lib/explain/rubric";

const LOCKED_TAIL = 3;
const MAX_CHARS = 4000;

function openLimit(stageCount: number) {
  if (stageCount <= 1) return stageCount;
  return Math.max(1, stageCount - LOCKED_TAIL);
}

export async function reviewStoredExplanation(input: {
  userId: string;
  stageId: string;
  answer: string;
  followUpAnswer?: string;
}): Promise<ExplainReview> {
  const stage = await prisma.roadmapStage.findUnique({
    where: { id: input.stageId },
    include: {
      skill: { select: { id: true, status: true, offer: true } },
      explainBackPrompt: true,
    },
  });
  if (!stage?.explainBackPrompt) return { ok: false, error: "unavailable" };

  const stageCount = await prisma.roadmapStage.count({ where: { skillId: stage.skillId } });
  const limit = openLimit(stageCount);
  const open =
    stage.skill.status === "AVAILABLE" &&
    stage.skill.offer === "FREE" &&
    !stage.monetized &&
    stage.order <= limit;
  if (!open) return { ok: false, error: "unavailable" };

  const answer = input.answer.trim().slice(0, MAX_CHARS);
  const followUpAnswer = input.followUpAnswer?.trim().slice(0, MAX_CHARS) ?? "";
  if (!answer || (input.followUpAnswer !== undefined && !followUpAnswer)) return { ok: false, error: "empty" };

  const failure = EXPLAIN_REVIEW_FAILURE_TEXT.toLowerCase();
  if (answer.toLowerCase() === failure || followUpAnswer.toLowerCase() === failure) {
    return { ok: false, error: "unavailable" };
  }

  const rubric = stage.explainBackPrompt.rubric;
  const followUpQuestion = followUpFor(rubric, coverRubric(answer, rubric));
  if (input.followUpAnswer === undefined) {
    return { ok: true, kind: "follow-up", question: followUpQuestion, quote: quoteFromAnswer(answer) };
  }

  const model = await gradeWithModel({
    question: stage.explainBackPrompt.question,
    rubric,
    answer,
    followUp: followUpQuestion,
    followUpAnswer,
  });
  const covered = model?.covered ?? coverRubric(`${answer}\n${followUpAnswer}`, rubric);
  const passed = model ? model.verdict === "PASSED" : passesRubric(covered);
  const feedback = model?.feedback ?? feedbackFor(rubric, covered, passed);

  await recordExplainBack({
    userId: input.userId,
    stageId: stage.id,
    skillId: stage.skillId,
    stageOrder: stage.order,
    stageCount,
    promptId: stage.explainBackPrompt.id,
    answer,
    followUpQuestion,
    followUpAnswer,
    verdict: passed ? "PASSED" : "NEEDS_IMPROVEMENT",
    feedback,
  });

  return passed
    ? { ok: true, kind: "pass", feedback }
    : { ok: true, kind: "needs-improvement", feedback };
}
