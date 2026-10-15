import { z } from "zod";

/**
 * The model's reply for Detox guidance: a short narrative and up to three playbook step ids. Lenient on purpose: a long
 * narrative is cut, and invalid ids are dropped later by settlePicks. Kept apart from guidance.ts so it can be tested.
 */
export const guidanceSchema = z.object({
  narrative: z
    .string()
    .trim()
    .min(40)
    .transform((value) => value.slice(0, 700)),
  steps: z
    .array(z.unknown())
    .optional()
    .transform((value) => (value ?? []).map((item) => (typeof item === "string" ? item : typeof item === "object" && item && "id" in item ? String((item as { id: unknown }).id) : "")).filter(Boolean)),
});

export type DetoxGuidance = { narrative: string; steps: string[]; source: "model" | "rules" };

/** Only well-formed guidance survives a read from the database. */
export function readGuidance(raw: unknown): DetoxGuidance | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.narrative !== "string" || !Array.isArray(value.steps)) return null;
  return {
    narrative: value.narrative,
    steps: value.steps.filter((id): id is string => typeof id === "string"),
    source: value.source === "model" ? "model" : "rules",
  };
}
