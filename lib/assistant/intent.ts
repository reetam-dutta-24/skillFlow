import { contentTerms } from "./rank";

/**
 * Question intent for the assistant, in plain code with unit tests. Two decisions live here: whether to read the
 * learner's own data for this question, and whether the question asks for an explanation of an explain-back idea the
 * learner has not passed yet (hint mode). Both are made on the server before any model call.
 */

const ABOUT_ME = /\b(?:my|mine|me|i|i'm|im|i've|ive|am i|should i|do i|next|progress|streak|score|plan|mastery|weak|due|recall|where (?:am|was) i|continue|certificate|band)\b/i;

/** True when the question is about the learner (their progress, streak, plan, score, what to do next). */
export function learnerIntent(question: string) {
  return ABOUT_ME.test(question);
}

const EXPLAIN = /\b(?:explain|explanation|define|definition|describe|what\s+(?:is|are|was|were|does|do|happens)|what's|whats|how\s+(?:does|do|is|are|can|to|would)|why\s+(?:does|do|is|are)|meaning\s+of|difference\s+between|tell\s+me\s+about|teach\s+me|summar(?:ise|ize|y)|give\s+me\s+(?:the|an?)\s+answer|answer\s+for|write\s+(?:my|the|an?)\s+(?:answer|explanation))\b/i;

/** True when the question asks for an idea to be explained (rather than where something is, or what to do next). */
export function explainIntent(question: string) {
  return EXPLAIN.test(question);
}

/** The question names this idea: enough of its content words appear (at least one, and half of up to four). */
export function mentions(question: string, idea: string) {
  const asked = new Set(contentTerms(question));
  const terms = contentTerms(idea);
  if (asked.size === 0 || terms.length === 0) return false;
  const hits = terms.filter((term) => asked.has(term) || [...asked].some((word) => word.length >= 4 && (word.startsWith(term) || term.startsWith(word)))).length;
  return hits >= 1 && hits / Math.min(terms.length, 4) >= 0.5;
}

export type GuardStage = {
  stageId: string;
  title: string;
  /** The stage's explain-back ideas: learning objectives, then rubric lines (stageConcepts). */
  concepts: string[];
  passed: boolean;
};

export type GuardDecision =
  | { mode: "answer" }
  | { mode: "hint"; stageId: string; concept: string };

/** How many of the top sources the guard looks at. */
export const GUARD_TOP = 3;

/**
 * Hint mode when the question asks to explain an idea, the best source is not a help article, one of the top sources sits in a stage this learner has not
 * passed, and the question names one of that stage's explain-back ideas (or the stage itself). The learner then gets
 * pointers, guiding questions, and a hint, never a model answer they could paste into the gate.
 */
export function explainBackGuard(input: {
  question: string;
  topStageIds: readonly (string | null)[];
  stages: ReadonlyMap<string, GuardStage>;
  /** The kind of the best source. When it is a help article, the question is about SkillFlow, not a stage idea. */
  firstKind?: string;
}): GuardDecision {
  if (!explainIntent(input.question) || input.firstKind === "help") return { mode: "answer" };
  for (const stageId of input.topStageIds.slice(0, GUARD_TOP)) {
    if (!stageId) continue;
    const stage = input.stages.get(stageId);
    if (!stage || stage.passed) continue;
    const concept = stage.concepts.find((item) => mentions(input.question, item));
    if (concept) return { mode: "hint", stageId, concept };
    if (mentions(input.question, stage.title)) return { mode: "hint", stageId, concept: stage.title };
  }
  return { mode: "answer" };
}
