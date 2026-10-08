import { isAvatarChoice, type AvatarStyle } from "@/lib/avatar";

/**
 * The display name and profile photo, shared by onboarding and Settings. Safe to import from client
 * components; the server repeats every check before it writes.
 */

export const MAX_DISPLAY_NAME = 50;

/** A display name is what other learners see. An email address is never used as one. */
export function displayNameProblem(value: string): string | null {
  const name = value.trim();
  if (!name) return "Enter a display name.";
  if (name.length < 2) return "Use at least 2 characters.";
  if (name.length > MAX_DISPLAY_NAME) return `Keep it under ${MAX_DISPLAY_NAME} characters.`;
  if (/\S+@\S+\.\S+/.test(name)) return "Use a name, not an email address.";
  return null;
}

/** A name that is really the email (or its first half) is offered as empty, so the learner picks one. */
export function suggestedDisplayName(name: string | null | undefined, email: string | null | undefined) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  const address = (email ?? "").toLowerCase();
  if (lower.includes("@")) return "";
  if (address && (lower === address || lower === address.split("@")[0])) return "";
  return trimmed;
}

/** What the learner chose for their photo. `keep` leaves the stored one alone. */
export type PhotoChoice =
  | { kind: "keep" }
  | { kind: "none" }
  | { kind: "upload"; url: string }
  | { kind: "avatar"; style: AvatarStyle; seed: string };

export const UPLOADED_IMAGE = /^\/uploads\/[a-z0-9]+\.(?:jpe?g|png|webp|gif)$/;

export function isPhotoChoice(value: unknown): value is PhotoChoice {
  if (!value || typeof value !== "object") return false;
  const choice = value as Record<string, unknown>;
  if (choice.kind === "keep" || choice.kind === "none") return true;
  if (choice.kind === "upload") return typeof choice.url === "string" && UPLOADED_IMAGE.test(choice.url);
  if (choice.kind === "avatar") return isAvatarChoice(choice.style, choice.seed);
  return false;
}
