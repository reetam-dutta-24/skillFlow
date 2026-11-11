import type { InputMethod } from "@/lib/explain/dictation";

/**
 * Is this explain-back answer the learner's own words? Plain code with unit tests.
 *
 * No detector can prove a text was written by an AI model, and a wrong flag hurts an honest learner (often one writing
 * in a second language). So nothing here acts on one weak signal. Three kinds of evidence are combined:
 *
 * 1. Tells in the text itself: chatbot phrases ("As an AI", "I hope this helps"), markdown headings and bullet lists,
 *    stock essay phrases, em dashes, very even sentences. Scored 0 to 1 by `textSignals`.
 * 2. How it reached the box: most of the answer pasted in, or typed faster than a person types. Reported by the
 *    browser, so it is supporting evidence only; a direct call can lie about it, and the text and model checks still run.
 * 3. The review model's own opinion (`generated` in its reply), which counts only together with another signal.
 *
 * A flagged answer is a strike on that stage. The first two are warnings and the answer is still judged; from the
 * third, a flagged answer is not accepted until the learner gives one in their own words (`integrityOutcome`).
 */

/** Flagged answers on one stage that only warn. The next flagged answer is not accepted. */
export const WARNING_STRIKES = 2;

/** Shorter answers carry too little text to judge style, so only a chatbot phrase can flag them. */
const MIN_STYLE_CHARS = 160;
const MIN_PASTE_CHARS = 120;
/** A share of the answer that arrived by paste, at or above which the answer counts as pasted. */
const PASTE_SHARE = 0.6;
/** Characters per second of focused typing above which it is faster than a person types, over a real length. */
const FAST_TYPING_CPS = 14;
const FAST_TYPING_MIN_CHARS = 220;

/** Phrases a chatbot writes and a learner explaining an idea almost never does. One is enough on its own. */
const CHATBOT_TELLS = [
  /\bas an ai\b/i,
  /\b(?:as a|i am an?) (?:large )?language model\b/i,
  /\bi hope (?:this|that) helps\b/i,
  /^\s*(?:certainly|sure|absolutely|of course)[!,.]\s/i,
  /\bgreat question\b/i,
  /\blet me know if you (?:have|need|want)\b/i,
  /\bhere(?:'s| is) (?:a|an|the) (?:clear|concise|simple|brief|detailed)? ?(?:explanation|breakdown|overview|summary)\b/i,
];

/** Stock phrases of generated prose. Each one adds a little; several together add up. */
const STOCK_PHRASES = [
  /\bdelve\b/i,
  /\bin (?:summary|conclusion|essence)\b/i,
  /\bit is (?:important|worth|crucial) (?:to note|noting|to remember)\b/i,
  /\bplays? an? (?:crucial|pivotal|vital|key|significant) role\b/i,
  /\b(?:furthermore|moreover|additionally),/i,
  /\b(?:seamless(?:ly)?|robust|leverag(?:e|es|ing)|multifaceted|tapestry|realm|landscape of)\b/i,
  /\bnot only\b[^.]{3,80}\bbut also\b/i,
  /\boverall,/i,
  /\bin today's (?:fast-paced|digital|modern) world\b/i,
  /\bserves as (?:a|an|the)\b/i,
  /\bkey (?:aspects|takeaways|considerations)\b/i,
  /\bensur(?:e|es|ing) that\b/i,
];

export type TextSignals = { score: number; reasons: string[]; chatbot: boolean };

function sentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length >= 3);
}

/** Style tells in the text, 0 (none) to 1 (reads like a chatbot reply). */
export function textSignals(answer: string): TextSignals {
  const text = answer.trim();
  const reasons: string[] = [];
  if (!text) return { score: 0, reasons, chatbot: false };

  const chatbot = CHATBOT_TELLS.some((pattern) => pattern.test(text));
  if (chatbot) reasons.push("It contains a phrase that AI chat tools write, not a learner.");
  if (text.length < MIN_STYLE_CHARS) return { score: chatbot ? 1 : 0, reasons, chatbot };

  let score = chatbot ? 0.8 : 0;
  const lines = text.split(/\n/).map((line) => line.trim());
  const listLines = lines.filter((line) => /^(?:[-*•]\s|\d{1,2}[.)]\s)/.test(line)).length;
  const formatted = listLines >= 2 || /^#{1,4}\s/m.test(text) || /\*\*[^*\n]{2,60}\*\*/.test(text);
  if (formatted) {
    score += 0.35;
    reasons.push("It is formatted like a generated reply (headings, bold, or a bullet list).");
  }

  const stock = STOCK_PHRASES.filter((pattern) => pattern.test(text)).length;
  if (stock > 0) {
    score += Math.min(0.45, stock * 0.15);
    if (stock >= 2) reasons.push("It leans on stock phrases that generated text uses.");
  }

  const dashes = (text.match(/—/g) ?? []).length;
  if (dashes >= 2) {
    score += 0.15;
    reasons.push("It uses several em dashes, which are rare in typed explanations.");
  }

  const parts = sentences(text);
  if (parts.length >= 5) {
    const lengths = parts.map((sentence) => sentence.split(/\s+/).length);
    const mean = lengths.reduce((sum, value) => sum + value, 0) / lengths.length;
    const spread = Math.sqrt(lengths.reduce((sum, value) => sum + (value - mean) ** 2, 0) / lengths.length) / mean;
    if (spread < 0.22 && mean >= 12) {
      score += 0.15;
      reasons.push("Its sentences are unusually even in length.");
    }
  }

  if (text.length > 1400) score += 0.1;
  return { score: Math.min(1, Math.round(score * 100) / 100), reasons, chatbot };
}

/** What the browser saw while the answer was written. Counts only; never the keystrokes themselves. */
export type TypingTrace = {
  /** Characters that arrived by typing. */
  typed: number;
  /** Characters that arrived by paste or drop. */
  pasted: number;
  /** Milliseconds the box had focus while the answer was written. */
  activeMs: number;
};

/** Anything malformed from the browser counts as no evidence at all. */
export function cleanTrace(value: unknown): TypingTrace | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const count = (field: unknown, max: number) =>
    typeof field === "number" && Number.isFinite(field) && field >= 0 ? Math.min(Math.round(field), max) : null;
  const typed = count(record.typed, 100_000);
  const pasted = count(record.pasted, 100_000);
  const activeMs = count(record.activeMs, 6 * 60 * 60 * 1000);
  if (typed === null || pasted === null || activeMs === null) return null;
  return { typed, pasted, activeMs };
}

export type TraceSignals = { pasted: boolean; fast: boolean; reasons: string[] };

export function traceSignals(answer: string, trace: TypingTrace | null, method: InputMethod): TraceSignals {
  const reasons: string[] = [];
  const length = answer.trim().length;
  // A spoken answer arrives in bursts by design, so paste and speed say nothing about it.
  if (!trace || method === "voice" || length === 0) return { pasted: false, fast: false, reasons };
  const pasted = length >= MIN_PASTE_CHARS && trace.pasted >= length * PASTE_SHARE;
  if (pasted) reasons.push("Most of it was pasted in rather than written here.");
  const seconds = trace.activeMs / 1000;
  const fast = trace.typed >= FAST_TYPING_MIN_CHARS && seconds > 0 && trace.typed / seconds > FAST_TYPING_CPS;
  if (fast) reasons.push("It arrived faster than a person types.");
  return { pasted, fast, reasons };
}

export type Authenticity = { flagged: boolean; reasons: string[] };

/**
 * One decision from every signal. `modelSaysGenerated` is null before the model has replied (a precheck); it never
 * flags an answer on its own.
 */
export function assessAuthenticity(input: {
  answer: string;
  method: InputMethod;
  trace: TypingTrace | null;
  modelSaysGenerated: boolean | null;
}): Authenticity {
  const text = textSignals(input.answer);
  const trace = traceSignals(input.answer, input.trace, input.method);
  const model = input.modelSaysGenerated === true;
  const reasons = [...text.reasons, ...trace.reasons];

  const flagged =
    text.chatbot ||
    trace.pasted ||
    text.score >= 0.7 ||
    (model && (text.score >= 0.3 || trace.fast)) ||
    (trace.fast && text.score >= 0.3);

  if (flagged && model) reasons.push("The reviewer also read it as generated text.");
  return { flagged, reasons: flagged ? [...new Set(reasons)].slice(0, 3) : [] };
}

export type IntegrityStatus = "clear" | "warning" | "blocked";

export type IntegrityOutcome = {
  status: IntegrityStatus;
  /** Strikes on this stage after this answer. */
  strikes: number;
  /** Warnings left before a flagged answer stops being accepted. */
  warningsLeft: number;
};

/** What a flagged (or clean) answer does, given the strikes this learner already has on the stage. */
export function integrityOutcome(strikesBefore: number, flagged: boolean): IntegrityOutcome {
  const before = Math.max(0, Math.floor(strikesBefore));
  if (!flagged) return { status: "clear", strikes: before, warningsLeft: Math.max(0, WARNING_STRIKES - before) };
  const strikes = before + 1;
  if (strikes > WARNING_STRIKES) return { status: "blocked", strikes, warningsLeft: 0 };
  return { status: "warning", strikes, warningsLeft: WARNING_STRIKES - strikes };
}

/** Whether one answer read as the learner's own words, and how many warnings are left on the stage. */
export type IntegrityView = IntegrityOutcome & {
  /** Up to three plain reasons, only when the answer was flagged. */
  reasons: string[];
};

/** True when the next flagged answer would not be accepted, so a clear-cut one can be refused before a model call. */
export function nextFlagBlocks(strikesBefore: number) {
  return strikesBefore >= WARNING_STRIKES;
}

/** What the learner reads on a blocked answer, in place of a review that would sound like a pass. */
export const BLOCKED_REVIEW =
  "This answer reads like it was written by an AI tool or pasted in, so it cannot count for this idea. Explain it the way you would to a friend, in your own words. Short and plain is fine, and so is imperfect English.";
