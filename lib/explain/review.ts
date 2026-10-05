import "server-only";
import { EXPLAIN_REVIEW_FAILURE_TEXT } from "@/lib/mock/config";
import { prisma } from "@/lib/prisma";
import type { ExplainReview } from "@/lib/types/pages";
import { quoteFromAnswer, stageConcepts } from "@/lib/explain/concepts";
import { decideExplainBack, explainModelConfig, judgeExplanation } from "@/lib/explain/judge";
import { recordExplainBack } from "@/lib/explain/record";

const LOCKED_TAIL = 3;
const MAX_CHARS = 8000;
const NOTE_LIMIT = 24;

function openLimit(stageCount: number) {
  if (stageCount <= 1) return stageCount;
  return Math.max(1, stageCount - LOCKED_TAIL);
}

export async function reviewStoredExplanation(input: {
  userId: string;
  stageId: string;
  answer: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
}): Promise<ExplainReview> {
  const stage = await prisma.roadmapStage.findUnique({
    where: { id: input.stageId },
    include: {
      skill: { select: { id: true, status: true, offer: true } },
      explainBackPrompt: true,
      resources: { orderBy: { order: "asc" }, select: { keyPoints: true } },
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
  const askedFollowUp = input.followUpQuestion?.trim().slice(0, 600) ?? "";
  if (!answer || (input.followUpAnswer !== undefined && !followUpAnswer)) return { ok: false, error: "empty" };

  const failure = EXPLAIN_REVIEW_FAILURE_TEXT.toLowerCase();
  if (answer.toLowerCase() === failure || followUpAnswer.toLowerCase() === failure) {
    return { ok: false, error: "unavailable" };
  }

  const concepts = stageConcepts(stage.learningObjectives, stage.explainBackPrompt.rubric);
  if (concepts.length === 0 || !explainModelConfig()) return { ok: false, error: "unconnected" };

  const notes = stage.resources.flatMap((resource) => resource.keyPoints).map((point) => point.trim()).filter(Boolean).slice(0, NOTE_LIMIT);
  const reply = await judgeExplanation({
    title: stage.title,
    description: stage.description,
    concepts,
    rubric: stage.explainBackPrompt.rubric,
    notes,
    stageQuestion: stage.explainBackPrompt.question,
    answer,
    followUp: input.followUpAnswer !== undefined ? askedFollowUp : undefined,
    followUpAnswer: input.followUpAnswer !== undefined ? followUpAnswer : undefined,
  });
  if (!reply) return { ok: false, error: "unavailable" };

  const turn = input.followUpAnswer === undefined ? "first" : "final";
  const decision = decideExplainBack(reply, turn);
  if (decision.kind === "follow-up") {
    return { ok: true, kind: "follow-up", question: decision.question, quote: quoteFromAnswer(answer) };
  }

  await recordExplainBack({
    userId: input.userId,
    stageId: stage.id,
    skillId: stage.skillId,
    stageOrder: stage.order,
    stageCount,
    promptId: stage.explainBackPrompt.id,
    answer,
    followUpQuestion: askedFollowUp || null,
    followUpAnswer: input.followUpAnswer !== undefined ? followUpAnswer : null,
    verdict: decision.kind === "pass" ? "PASSED" : "NEEDS_IMPROVEMENT",
    feedback: decision.feedback,
  });

  return decision.kind === "pass"
    ? { ok: true, kind: "pass", feedback: decision.feedback }
    : { ok: true, kind: "needs-improvement", feedback: decision.feedback };
}
