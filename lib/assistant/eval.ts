/**
 * Retrieval evaluation helpers, in plain code: the eval file's shape, how a retrieved chunk is matched to an expected
 * source key, and the metrics scripts/assistant-eval.ts prints.
 */
import { z } from "zod";

export const evalFileSchema = z.object({
  about: z.string().optional(),
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        question: z.string().min(3).max(1000),
        expect: z.array(z.string().regex(/^(help|skill|stage|resource):[a-z0-9-]+(\/\d+){0,2}$/)),
        mode: z.enum(["answer", "hint", "not-sure"]),
      }).strict(),
    )
    .min(30),
}).strict();

export type EvalFile = z.infer<typeof evalFileSchema>;
export type EvalQuestion = EvalFile["questions"][number];

/** A chunk key matches an expected key when it is the same source, or a resource inside the expected stage. */
export function keyMatches(chunkKey: string, expected: string) {
  if (chunkKey === expected) return true;
  if (expected.startsWith("stage:") && chunkKey.startsWith("resource:")) {
    return chunkKey.slice("resource:".length).startsWith(`${expected.slice("stage:".length)}/`);
  }
  return false;
}

/** 1-based rank of the first retrieved key that matches any expected key, or null. */
export function firstHit(retrievedKeys: readonly string[], expected: readonly string[]) {
  const index = retrievedKeys.findIndex((key) => expected.some((want) => keyMatches(key, want)));
  return index === -1 ? null : index + 1;
}

export type EvalOutcome = {
  question: EvalQuestion;
  keys: string[];
  predicted: "answer" | "hint" | "not-sure";
};

export function metrics(outcomes: readonly EvalOutcome[], k = 5) {
  const retrievable = outcomes.filter((item) => item.question.expect.length > 0);
  let recall = 0;
  let reciprocal = 0;
  for (const item of retrievable) {
    const rank = firstHit(item.keys, item.question.expect);
    if (rank !== null && rank <= k) recall += 1;
    if (rank !== null) reciprocal += 1 / rank;
  }
  const notSureRight = outcomes.filter((item) => (item.predicted === "not-sure") === (item.question.mode === "not-sure")).length;
  const answerable = outcomes.filter((item) => item.question.mode !== "not-sure");
  const modeRight = answerable.filter((item) => item.predicted === item.question.mode).length;
  return {
    recallAtK: retrievable.length ? recall / retrievable.length : 0,
    mrr: retrievable.length ? reciprocal / retrievable.length : 0,
    notSureAccuracy: outcomes.length ? notSureRight / outcomes.length : 0,
    hintAccuracy: answerable.length ? modeRight / answerable.length : 0,
    counts: { total: outcomes.length, retrievable: retrievable.length, answerable: answerable.length },
  };
}
