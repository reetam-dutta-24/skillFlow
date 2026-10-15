import type { DetoxGuidance } from "./guidance-schema";
import { rulesPick } from "./playbook";
import type { DetoxAnswers, DetoxSection } from "./questions";
import { bandFor, type WeekCounts } from "./score";

/** Guidance for the Detox page, without a model. Plain code, so it can be tested and used as the fallback. */

export type GuidanceInput = {
  answers: DetoxAnswers;
  baseline: number;
  score: number;
  sections: Partial<Record<DetoxSection, number>>;
  week: WeekCounts | null;
};

/**
 * Which guidance a learner gets. Distress shows the support card and never calls a model. Otherwise the model writes
 * the words when a key is set and the AI limit allows it; the rules write them when not.
 */
export function guidanceRoute(input: { distress: boolean; hasModel: boolean; allowed: boolean }): "support" | "model" | "rules" {
  if (input.distress) return "support";
  return input.hasModel && input.allowed ? "model" : "rules";
}

const AREA_PHRASE: Partial<Record<DetoxSection, string>> = {
  screen: "the hours your screen is on",
  "short-form": "short video and social apps",
  reaching: "picking up the phone without deciding to",
  focus: "staying with one task",
  sleep: "sleep and routine",
  offline: "time away from screens",
};

/** Guidance in plain code: used when there is no model key, the AI limit is reached, or the reply is unusable. */
export function rulesGuidance(input: GuidanceInput): DetoxGuidance {
  const band = bandFor(input.score);
  const weakest = (Object.entries(input.sections) as [DetoxSection, number][])
    .filter(([section]) => section !== "mood" && AREA_PHRASE[section])
    .sort((a, b) => a[1] - b[1])[0]?.[0];
  const opener =
    input.score > input.baseline
      ? `You have moved from ${input.baseline} to ${input.score} on real learning, and that is earned, not guessed.`
      : `Right now you are in the ${band.label} band, and that is a starting point, not a verdict.`;
  const focus = weakest ? ` The quickest win in your answers is ${AREA_PHRASE[weakest]}.` : "";
  return {
    narrative: `${opener}${focus} Pick one of the steps below for this week and let the score follow what you actually do.`,
    steps: rulesPick(input.answers, input.sections),
    source: "rules",
  };
}
