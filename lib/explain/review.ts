import "server-only";
import { EXPLAIN_REVIEW_FAILURE_TEXT } from "@/lib/mock/config";
import { prisma } from "@/lib/prisma";
import type { ExplainReview } from "@/lib/types/pages";
import { quoteFromAnswer } from "@/lib/explain/concepts";
import { conceptsForGate } from "@/lib/explain/gate-concepts";
import { ensureGateConcepts } from "@/lib/explain/gate-store";
import { decideExplainBack, explainModelConfig, judgeConcept, judgeExplanation } from "@/lib/explain/judge";
import { recordExplainBack } from "@/lib/explain/record";
import { saveLearnerNotes } from "@/lib/explain/notes";
import { notesFromPassedAttempt } from "@/lib/explain/notes-view";
import { readyWizardSteps, type WizardStep } from "@/lib/explain/wizard";

const LOCKED_TAIL = 3;
const MAX_CHARS = 8000;
const NOTE_LIMIT = 24;

function openLimit(stageCount: number) {
  if (stageCount <= 1) return stageCount;
  return Math.max(1, stageCount - LOCKED_TAIL);
}

async function loadOpenExplainStage(stageId: string, userId: string) {
  await ensureGateConcepts(stageId);
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

  const earlier = await prisma.roadmapStage.findMany({
    where: { skillId: stage.skillId, monetized: false, order: { lt: stage.order, lte: limit } },
    select: { id: true },
  });
  if (earlier.length > 0) {
    const [passed, already] = await Promise.all([
      prisma.stageCompletion.count({
        where: { userId, explainBackPassed: true, stageId: { in: earlier.map((item) => item.id) } },
      }),
      prisma.stageCompletion.findUnique({
        where: { userId_stageId: { userId, stageId: stage.id } },
        select: { explainBackPassed: true },
      }),
    ]);
    if (passed < earlier.length && !already?.explainBackPassed) return null;
  }

  const generated = Boolean(prompt.conceptSourceHash);
  const concepts = conceptsForGate(stage.learningObjectives, prompt.rubric, generated);
  const notes = [
    ...stage.resources.flatMap((resource) => resource.keyPoints),
    ...(generated ? prompt.rubric : []),
  ]
    .map((point) => point.trim())
    .filter(Boolean)
    .slice(0, generated ? 48 : NOTE_LIMIT);
  return { stage, prompt, stageCount, concepts, notes };
}

export async function reviewStoredExplanation(input: {
  userId: string;
  stageId: string;
  answer: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
}): Promise<ExplainReview> {
  const loaded = await loadOpenExplainStage(input.stageId, input.userId);
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

  if (decision.kind === "pass") {
    await saveLearnerNotes({
      userId: input.userId,
      skillId: stage.skillId,
      stageId: stage.id,
      steps: notesFromPassedAttempt({ stageTitle: stage.title, explanation: answer, feedback: decision.feedback }),
    });
  }

  return decision.kind === "pass"
    ? { ok: true, kind: "pass", feedback: decision.feedback }
    : { ok: true, kind: "needs-improvement", feedback: decision.feedback };
}

export type ConceptStepResult =
  | { ok: true; understood: boolean; review: string; noted: boolean }
  | { ok: false; error: "empty" | "unavailable" | "unconnected" };

/** Grade one idea. An accepted idea is stored as a note. The stage is recorded only after every idea has passed. */
export async function reviewConceptStep(input: {
  userId: string;
  stageId: string;
  concept: string;
  answer: string;
}): Promise<ConceptStepResult> {
  const loaded = await loadOpenExplainStage(input.stageId, input.userId);
  if (!loaded) return { ok: false, error: "unavailable" };
  const { stage, prompt, stageCount, concepts, notes } = loaded;
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
  if (!review.understood) {
    try {
      await recordExplainBack({
        userId: input.userId,
        stageId: stage.id,
        skillId: stage.skillId,
        stageOrder: stage.order,
        stageCount,
        promptId: prompt.id,
        answer: `${concept}\n${answer}`.slice(0, MAX_CHARS),
        followUpQuestion: concept,
        followUpAnswer: null,
        verdict: "NEEDS_IMPROVEMENT",
        feedback: review.review,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "miss save failed";
      console.error("explain-back miss save failed", message.slice(0, 180));
    }
    return { ok: true, understood: false, review: review.review, noted: false };
  }
  const noted = await saveLearnerNotes({
    userId: input.userId,
    skillId: stage.skillId,
    stageId: stage.id,
    steps: [{ concept, explanation: answer, review: review.review, position: concepts.indexOf(concept) }],
  });
  return { ok: true, understood: review.understood, review: review.review, noted };
}

/** Record the stage once every idea has a real answer and a written review, in order. */
export async function finishExplainWizard(input: {
  userId: string;
  stageId: string;
  steps: WizardStep[];
}): Promise<{ ok: true } | { ok: false; error: "empty" | "unavailable" | "unconnected" }> {
  const loaded = await loadOpenExplainStage(input.stageId, input.userId);
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
  await saveLearnerNotes({
    userId: input.userId,
    skillId: stage.skillId,
    stageId: stage.id,
    steps: steps.map((step, position) => ({
      concept: step.concept,
      explanation: step.answer,
      review: step.review,
      position,
    })),
  });
  return { ok: true };
}
