/**
 * Plain helpers for speaking an explanation instead of typing it. The browser's own speech recognition turns speech
 * into text (components/learning/useDictation.ts); these decide how that text joins the draft and how the answer is
 * labelled. No audio ever reaches SkillFlow: only the words that land in the box are sent, like typed text.
 */

export type InputMethod = "text" | "voice" | "mixed";

const SENTENCE_END = /[.!?…]\s*$/;

/** Join one spoken phrase onto the draft: one space between, a capital letter where a sentence starts. */
export function appendSpoken(draft: string, spoken: string): string {
  const phrase = spoken.replace(/\s+/g, " ").trim();
  if (!phrase) return draft;
  const base = draft.replace(/\s+$/, "");
  const startsSentence = base.length === 0 || SENTENCE_END.test(base);
  const text = startsSentence ? phrase.charAt(0).toUpperCase() + phrase.slice(1) : phrase;
  return base.length === 0 ? text : `${base} ${text}`;
}

/** How an answer was given: mostly spoken, mostly typed, or both. Spoken characters are counted as they arrive. */
export function answerMethod(answer: string, spokenChars: number): InputMethod {
  const total = answer.trim().length;
  if (total === 0 || spokenChars <= 0) return "text";
  const share = Math.min(1, spokenChars / total);
  if (share >= 0.8) return "voice";
  if (share <= 0.1) return "text";
  return "mixed";
}

/** One label for a whole stage from each idea's label. */
export function stageMethod(methods: readonly InputMethod[]): InputMethod {
  if (methods.length === 0) return "text";
  if (methods.every((method) => method === "voice")) return "voice";
  if (methods.every((method) => method === "text")) return "text";
  return "mixed";
}

/** Anything else the browser sends is stored as typed text. */
export function cleanMethod(value: unknown): InputMethod {
  return value === "voice" || value === "mixed" ? value : "text";
}

/** The speech recognition language: the browser's own language, which is what the learner speaks most often. */
export function dictationLang(browserLang: string | undefined): string {
  const lang = (browserLang ?? "").trim();
  return /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(lang) ? lang : "en-IN";
}

/** Plain words for each recognition error the browser can report. Null for the ones that need no message. */
export function dictationErrorText(code: string): string | null {
  if (code === "no-speech" || code === "aborted") return null;
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "The microphone is blocked for SkillFlow. Allow it in the browser's site settings, or type instead.";
  }
  if (code === "audio-capture") return "No microphone was found. Plug one in, or type instead.";
  if (code === "network") return "Voice needs an internet connection in this browser. Type instead, or try again.";
  if (code === "language-not-supported") return "This browser cannot listen in your language yet. Type instead.";
  return "Voice stopped. Try again, or type instead.";
}
