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
import { openStageLimit } from "@/lib/progress/formula";
import { stepsFromNotes } from "@/lib/explain/wizard";
import type { InputMethod } from "@/lib/explain/dictation";
import {
  BLOCKED_REVIEW,
  assessAuthenticity,
  integrityOutcome,
  nextFlagBlocks,
  type IntegrityView,
  type TypingTrace,
} from "@/lib/explain/authenticity";
import { addStrike, stageStrikes } from "@/lib/explain/integrity-store";
import { KIND_LABEL, checkProof, handsOnSpec, handsOnTask, linkWorthReading } from "@/lib/explain/hands-on";
import { judgeProof } from "@/lib/explain/judge";
import { loadPracticePages } from "@/lib/explain/page-source";

const MAX_CHARS = 8000;
const NOTE_LIMIT = 24;

async function loadOpenExplainStage(stageId: string, userId: string) {
  await ensureGateConcepts(stageId);
  const stage = await prisma.roadmapStage.findUnique({
    where: { id: stageId },
    include: {
      skill: { select: { id: true, slug: true, name: true, status: true, offer: true } },
      explainBackPrompt: true,
      resources: { orderBy: { order: "asc" }, select: { keyPoints: true } },
    },
  });
  const prompt = stage?.explainBackPrompt;
  if (!stage || !prompt) return null;

  const stageCount = await prisma.roadmapStage.count({ where: { skillId: stage.skillId } });
  const limit = openStageLimit(stageCount);
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

/** The ideas a learner explains for one open stage, in order. Null when the stage is not open to them. */
export async function openStageIdeas(stageId: string, userId: string) {
  const loaded = await loadOpenExplainStage(stageId, userId);
  if (!loaded) return null;
  return { stageId: loaded.stage.id, title: loaded.stage.title, concepts: loaded.concepts };
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
  | { ok: true; understood: boolean; review: string; noted: boolean; integrity: IntegrityView }
  | { ok: false; error: "empty" | "unavailable" | "unconnected" };

/** Grade one idea. An accepted idea is stored as a note. The stage is recorded only after every idea has passed. */
export async function reviewConceptStep(input: {
  userId: string;
  stageId: string;
  concept: string;
  answer: string;
  method?: InputMethod;
  /** Paste and typing counts from the browser. Supporting evidence only. */
  trace?: TypingTrace | null;
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

  const method = input.method ?? "text";
  const trace = input.trace ?? null;
  const strikesBefore = await stageStrikes(input.userId, stage.id);
  // Warnings used up and the answer is clearly not the learner's own (a chatbot phrase, or pasted in): refuse it
  // before spending a model call. Nothing is saved apart from the strike.
  const precheck = assessAuthenticity({ answer, method, trace, modelSaysGenerated: null });
  if (precheck.flagged && nextFlagBlocks(strikesBefore)) {
    const strikes = await addStrike(input.userId, stage.id);
    return {
      ok: true,
      understood: false,
      review: BLOCKED_REVIEW,
      noted: false,
      integrity: { status: "blocked", strikes, warningsLeft: 0, reasons: precheck.reasons },
    };
  }

  const review = await judgeConcept({
    title: stage.title,
    description: stage.description,
    concept,
    others: concepts.filter((item) => item !== concept),
    notes,
    answer,
  });
  if (!review) return { ok: false, error: "unavailable" };

  const check = assessAuthenticity({ answer, method, trace, modelSaysGenerated: review.generated });
  const outcome = integrityOutcome(strikesBefore, check.flagged);
  const strikes = check.flagged ? await addStrike(input.userId, stage.id) : outcome.strikes;
  const integrity: IntegrityView = { ...outcome, strikes, reasons: check.reasons };
  // A flagged answer after the warnings is not accepted, even when it is right. It is not a learning miss either, so
  // no attempt is recorded and weak topics stay true to what the learner actually got wrong.
  if (integrity.status === "blocked") {
    return { ok: true, understood: false, review: BLOCKED_REVIEW, noted: false, integrity };
  }

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
        inputMethod: input.method,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "miss save failed";
      console.error("explain-back miss save failed", message.slice(0, 180));
    }
    return { ok: true, understood: false, review: review.review, noted: false, integrity };
  }
  const noted = await saveLearnerNotes({
    userId: input.userId,
    skillId: stage.skillId,
    stageId: stage.id,
    steps: [{ concept, explanation: answer, review: review.review, position: concepts.indexOf(concept) }],
  });
  // The note is what lets the stage be recorded later, so an idea that could not be stored has not moved on.
  if (!noted) return { ok: false, error: "unavailable" };
  return { ok: true, understood: review.understood, review: review.review, noted, integrity };
}

/**
 * Record the stage once every idea has been accepted by the server, in order. The answers and reviews come from the
 * stage notes `reviewConceptStep` wrote after the model marked each idea understood, never from the browser.
 */
export async function finishExplainWizard(input: {
  userId: string;
  stageId: string;
  method?: InputMethod;
}): Promise<{ ok: true } | { ok: false; error: "empty" | "unavailable" | "unconnected" | "proof" }> {
  const loaded = await loadOpenExplainStage(input.stageId, input.userId);
  if (!loaded) return { ok: false, error: "unavailable" };
  const { stage, prompt, stageCount, concepts } = loaded;
  if (concepts.length === 0 || !explainModelConfig()) return { ok: false, error: "unconnected" };

  const accepted = await prisma.learnerNote.findMany({
    where: { userId: input.userId, stageId: stage.id, kind: "stage", concept: { in: concepts } },
    select: { concept: true, explanation: true, review: true },
  });
  const steps = stepsFromNotes(concepts, accepted);
  if (!steps) return { ok: false, error: "empty" };

  // On a practical path, explaining is half of it: the stage also needs one accepted piece of hands-on work.
  if (handsOnSpec(stage.skill.slug)) {
    const proof = await prisma.practicalProof.findUnique({
      where: { userId_stageId: { userId: input.userId, stageId: stage.id } },
      select: { accepted: true },
    });
    if (!proof?.accepted) return { ok: false, error: "proof" };
  }

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
    inputMethod: input.method,
  });
  return { ok: true };
}

export type HandsOnResult =
  | { ok: true; accepted: boolean; review: string; integrity: IntegrityView }
  | { ok: false; error: "unavailable" | "unconnected" | "invalid"; message?: string };

/**
 * Review one piece of hands-on work for a stage on a practical path. The form is checked in plain code first, the
 * write-up goes through the same own-words check as an explain-back answer (strikes are shared with the stage), a
 * linked page's text is read when it could help, and the model judges the write-up. The latest submission replaces
 * the last; it only counts once accepted.
 */
export async function reviewHandsOnStep(input: {
  userId: string;
  stageId: string;
  kind: unknown;
  url: unknown;
  writeUp: unknown;
  method?: InputMethod;
  trace?: TypingTrace | null;
}): Promise<HandsOnResult> {
  const loaded = await loadOpenExplainStage(input.stageId, input.userId);
  if (!loaded) return { ok: false, error: "unavailable" };
  const { stage } = loaded;
  const spec = handsOnSpec(stage.skill.slug);
  if (!spec) return { ok: false, error: "unavailable" };
  if (!explainModelConfig()) return { ok: false, error: "unconnected" };

  const checked = checkProof(spec, { kind: input.kind, url: input.url, writeUp: input.writeUp });
  if (!checked.ok) return { ok: false, error: "invalid", message: checked.error };
  const { proof } = checked;
  if (proof.writeUp.toLowerCase() === EXPLAIN_REVIEW_FAILURE_TEXT.toLowerCase()) return { ok: false, error: "unavailable" };

  const method = input.method ?? "text";
  const trace = input.trace ?? null;
  const strikesBefore = await stageStrikes(input.userId, stage.id);
  const precheck = assessAuthenticity({ answer: proof.writeUp, method, trace, modelSaysGenerated: null });
  if (precheck.flagged && nextFlagBlocks(strikesBefore)) {
    const strikes = await addStrike(input.userId, stage.id);
    return { ok: true, accepted: false, review: BLOCKED_REVIEW, integrity: { status: "blocked", strikes, warningsLeft: 0, reasons: precheck.reasons } };
  }

  // A repository or a write-up page can say what was built; a video player or a drive link says nothing, so it is
  // not fetched. The fetch goes through the same public-https guard as practice notes.
  let pageText: string | null = null;
  if (proof.kind === "link" && linkWorthReading(proof.url)) {
    const pages = await loadPracticePages([proof.url]).catch(() => ({ texts: [] as string[], blocked: false, missed: true }));
    pageText = pages.texts[0] ?? null;
  }

  const review = await judgeProof({
    skillName: stage.skill.name,
    stageTitle: stage.title,
    objectives: stage.learningObjectives,
    task: handsOnTask(spec, stage.title),
    kindLabel: KIND_LABEL[proof.kind],
    url: proof.url,
    pageText,
    writeUp: proof.writeUp,
  });
  if (!review) return { ok: false, error: "unavailable" };

  const check = assessAuthenticity({ answer: proof.writeUp, method, trace, modelSaysGenerated: review.generated });
  const outcome = integrityOutcome(strikesBefore, check.flagged);
  const strikes = check.flagged ? await addStrike(input.userId, stage.id) : outcome.strikes;
  const integrity: IntegrityView = { ...outcome, strikes, reasons: check.reasons };
  const blocked = integrity.status === "blocked";
  const accepted = review.understood && !blocked;
  const shown = blocked ? BLOCKED_REVIEW : review.review;

  await prisma.practicalProof.upsert({
    where: { userId_stageId: { userId: input.userId, stageId: stage.id } },
    create: { userId: input.userId, stageId: stage.id, kind: proof.kind, url: proof.url, writeUp: proof.writeUp, review: shown, accepted, inputMethod: method },
    update: { kind: proof.kind, url: proof.url, writeUp: proof.writeUp, review: shown, accepted, inputMethod: method },
  });
  return { ok: true, accepted, review: shown, integrity };
}
