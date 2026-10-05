import "server-only";
import { EXPLAIN_REVIEW_FAILURE_TEXT } from "@/lib/mock/config";
import { prisma } from "@/lib/prisma";
import type { ExplainReview } from "@/lib/types/pages";
import { quoteFromAnswer, stageConcepts } from "@/lib/explain/concepts";
import { decideExplainBack, explainModelConfig, judgeConcept, judgeExplanation } from "@/lib/explain/judge";
import { recordExplainBack } from "@/lib/explain/record";
import { readyWizardSteps, type WizardStep } from "@/lib/explain/wizard";

const LOCKED_TAIL = 3;
const MAX_CHARS = 8000;
const NOTE_LIMIT = 24;

function openLimit(stageCount: number) {
  if (stageCount <= 1) return stageCount;
  return Math.max(1, stageCount - LOCKED_TAIL);
}

async function loadOpenExplainStage(stageId: string) {
  const stage = await prisma.roadmapStage.findUnique({
    where: { id: stageId },
    include: {
      skill: { select: { id: true, status: true, offer: true } },
      explainBackPrompt: true,
      resources: { orderBy: { order: "asc" }, select: { keyPoints: true } },
    },
  });
  const prompt = stage?.explainBackPrompt;
  if (!stage || !prompt) return null;

  const stageCount = await prisma.roadmapStage.count({ where: { skillId: stage.skillId } });
  const limit = openLimit(stageCount);
  const open =
    stage.skill.status === "AVAILABLE" &&
    stage.skill.offer === "FREE" &&
    !stage.monetized &&
    stage.order <= limit;
  if (!open) return null;

  const concepts = stageConcepts(stage.learningObjectives, prompt.rubric);
  const notes = stage.resources
    .flatMap((resource) => resource.keyPoints)
    .map((point) => point.trim())
    .filter(Boolean)
    .slice(0, NOTE_LIMIT);
  return { stage, prompt, stageCount, concepts, notes };
}

export async function reviewStoredExplanation(input: {
  userId: string;
  stageId: string;
  answer: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
}): Promise<ExplainReview> {
  const loaded = await loadOpenExplainStage(input.stageId);
  if (!loaded) return { ok: false, error: "unavailable" };
  const { stage, prompt, stageCount, concepts, notes } = loaded;

  const answer = input.answer.trim().slice(0, MAX_CHARS);
  const followUpAnswer = input.followUpAnswer?.trim().slice(0, MAX_CHARS) ?? "";
  const askedFollowUp = input.followUpQuestion?.trim().slice(0, 600) ?? "";
  if (!answer || (input.followUpAnswer !== undefined && !followUpAnswer)) return { ok: false, error: "empty" };

  const failure = EXPLAIN_REVIEW_FAILURE_TEXT.toLowerCase();
  if (answer.toLowerCase() === failure || followUpAnswer.toLowerCase() === failure) {
    return { ok: false, error: "unavailable" };
  }

  if (concepts.length === 0 || !explainModelConfig()) return { ok: false, error: "unconnected" };

  const reply = await judgeExplanation({
    title: stage.title,
    description: stage.description,
    concepts,
    rubric: prompt.rubric,
    notes,
    stageQuestion: prompt.question,
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
    promptId: prompt.id,
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

export type ConceptStepResult =
  | { ok: true; understood: boolean; review: string }
  | { ok: false; error: "empty" | "unavailable" | "unconnected" };

/** Grade one idea. An empty or thin reply stays on this step. Nothing is saved until every idea has passed. */
export async function reviewConceptStep(input: {
  stageId: string;
  concept: string;
  answer: string;
}): Promise<ConceptStepResult> {
  const loaded = await loadOpenExplainStage(input.stageId);
  if (!loaded) return { ok: false, error: "unavailable" };
  const { stage, concepts, notes } = loaded;
  const concept = input.concept.trim();
  if (!concepts.includes(concept)) return { ok: false, error: "unavailable" };
  if (!explainModelConfig()) return { ok: false, error: "unconnected" };

  const answer = input.answer.trim().slice(0, MAX_CHARS);
  if (!answer) return { ok: false, error: "empty" };
  if (answer.toLowerCase() === EXPLAIN_REVIEW_FAILURE_TEXT.toLowerCase()) return { ok: false, error: "unavailable" };

  const review = await judgeConcept({
    title: stage.title,
    description: stage.description,
    concept,
    others: concepts.filter((item) => item !== concept),
    notes,
    answer,
  });
  if (!review) return { ok: false, error: "unavailable" };
  return { ok: true, understood: review.understood, review: review.review };
}

/** Record the stage once every idea has a real answer and a written review, in order. */
export async function finishExplainWizard(input: {
  userId: string;
  stageId: string;
  steps: WizardStep[];
}): Promise<{ ok: true } | { ok: false; error: "empty" | "unavailable" | "unconnected" }> {
  const loaded = await loadOpenExplainStage(input.stageId);
  if (!loaded) return { ok: false, error: "unavailable" };
  const { stage, prompt, stageCount, concepts } = loaded;
  if (concepts.length === 0 || !explainModelConfig()) return { ok: false, error: "unconnected" };

  const steps = readyWizardSteps(concepts, input.steps);
  if (!steps) return { ok: false, error: "empty" };
  const failure = EXPLAIN_REVIEW_FAILURE_TEXT.toLowerCase();
  if (steps.some((step) => step.answer.toLowerCase() === failure)) return { ok: false, error: "unavailable" };

  const answer = steps.map((step) => `${step.concept}\n${step.answer}`).join("\n\n").slice(0, 24_000);
  const feedback = steps.map((step) => `${step.concept}\n${step.review}`).join("\n\n").slice(0, 12_000);
  await recordExplainBack({
    userId: input.userId,
    stageId: stage.id,
    skillId: stage.skillId,
    stageOrder: stage.order,
    stageCount,
    promptId: prompt.id,
    answer,
    followUpQuestion: null,
    followUpAnswer: null,
    verdict: "PASSED",
    feedback,
  });
  return { ok: true };
}
