/**
 * Small shared rules for where Detox shows up: the Home card and the support branch. Plain code, unit-tested.
 */

export type DetoxStatus = "none" | "in-progress" | "complete";

/** What the Home card shows: an invite, a resume, the support card, or the score. */
export function detoxCardState(input: { status: DetoxStatus; distress: boolean }): "invite" | "resume" | "support" | "score" {
  if (input.status === "none") return "invite";
  if (input.status === "in-progress") return "resume";
  return input.distress ? "support" : "score";
}

/** India's national mental-health line, and a second line for anyone outside India. Shown in the support card. */
export const SUPPORT_LINES = [
  { name: "Tele-MANAS (India, free, 24 hours)", numbers: ["14416", "1-800-891-4416"] },
] as const;

export const NOT_MEDICAL =
  "This is a self-improvement score from your own answers and your learning activity, not a medical test.";
