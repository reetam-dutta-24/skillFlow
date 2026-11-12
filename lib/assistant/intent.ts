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

/**
 * Hint mode decides on every source the model would see (not only the first few), for a stage this learner has not
 * passed:
 *
 * - The question names one of that stage's explain-back ideas: hint, however it is phrased ("the knight moves how?",
 *   "write a paragraph on knight moves"), because the wording of a request is easy to change and the idea is not. The
 *   one exception is a question that does not ask for an explanation while a help article ranks first: that is a
 *   question about LearnProof that happens to share words with a stage.
 * - The question names only the stage title: hint when it also asks for an explanation and the best source is not a
 *   help article, because a title is broad.
 *
 * The learner then gets pointers, guiding questions, and a hint, never a model answer they could paste into the gate.
 */
export function explainBackGuard(input: {
  /** Every source the model would be given, best first. */
  topStageIds: readonly (string | null)[];
  question: string;
  stages: ReadonlyMap<string, GuardStage>;
  /** The kind of the best source. A help article first means the question is probably about LearnProof itself. */
  firstKind?: string;
}): GuardDecision {
  const asksToExplain = explainIntent(input.question);
  const aboutLearnProof = input.firstKind === "help";
  for (const stageId of input.topStageIds) {
    if (!stageId) continue;
    const stage = input.stages.get(stageId);
    if (!stage || stage.passed) continue;
    const concept = stage.concepts.find((item) => mentions(input.question, item));
    if (concept && (asksToExplain || !aboutLearnProof)) return { mode: "hint", stageId, concept };
    if (asksToExplain && !aboutLearnProof && mentions(input.question, stage.title)) {
      return { mode: "hint", stageId, concept: stage.title };
    }
  }
  return { mode: "answer" };
}
