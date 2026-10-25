import { z } from "zod";

/**
 * The assistant's request body and stream events, shared by app/api/assistant/route.ts and the panel. The stream is
 * newline-delimited JSON: one `meta` event, any number of `delta` events, then exactly one `final` or `error`.
 */

export const MAX_MESSAGE = 1000;
export const MAX_HISTORY = 6;
/** A past assistant turn is cut to this before it is sent back; the model only needs the gist for a follow-up. */
export const MAX_HISTORY_CHARS = 1200;

export const assistantRequestSchema = z.object({
  message: z.string().trim().min(1, "Ask a question first.").max(MAX_MESSAGE, `Keep it under ${MAX_MESSAGE} characters.`),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }).strict())
    .max(MAX_HISTORY, `Send at most ${MAX_HISTORY} earlier turns.`)
    .default([]),
  pathname: z.string().max(300).regex(/^\/[^\s]*$/, "Must be an app path.").optional(),
}).strict();

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

export type SourceKind = "help" | "skill" | "stage" | "resource" | "video" | "learner";

export type AssistantSource = {
  n: number;
  kind: SourceKind;
  title: string;
  /** Where the source chip and list item link: an in-app page whenever there is one. */
  href: string;
  /** The resource's own page, opened in a new tab. */
  external: string | null;
  /** One short line: the niche and stage, or what the help article covers. */
  detail: string;
};

export type AssistantMode = "answer" | "hint" | "not-sure";

export type AssistantErrorCode = "rate-limit" | "unavailable" | "invalid" | "signed-out";

export type AssistantEvent =
  | { t: "meta"; mode: AssistantMode }
  | { t: "delta"; text: string }
  | { t: "final"; mode: AssistantMode; text: string; sources: AssistantSource[] }
  | { t: "error"; code: AssistantErrorCode; message: string };

export const ERROR_COPY: Record<AssistantErrorCode, string> = {
  "rate-limit": "You have asked a lot in a short time. Take a breath, and try again in a minute.",
  unavailable: "The assistant cannot reach its model right now. Nothing was saved; try again in a moment.",
  invalid: "That question could not be sent. Keep it under 1,000 characters and try again.",
  "signed-out": "Sign in again to use the assistant.",
};

/** Keeps the last turns, newest last, each cut to a size the model needs for a follow-up. */
export function trimHistory(history: AssistantRequest["history"]) {
  return history.slice(-MAX_HISTORY).map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_HISTORY_CHARS) }));
}

/** Parses one line of the stream; null for anything that is not an event. */
export function parseEvent(line: string): AssistantEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const value = JSON.parse(trimmed) as { t?: unknown };
    return value && typeof value === "object" && typeof value.t === "string" ? (value as AssistantEvent) : null;
  } catch {
    return null;
  }
}
