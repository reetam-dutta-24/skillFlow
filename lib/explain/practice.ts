export const PRACTICE_STAGE_ORDER = 10_000;

const MIN_SOURCE = 40;
const MAX_SOURCE = 12_000;

export function practiceStageId(skillId: string) {
  return `practice:${skillId}`;
}

export function practiceKey(userId: string, skillId: string, concept: string) {
  return `${userId}:${skillId}:${concept.trim().toLowerCase()}`;
}

/** The learner's own text, trimmed to what the model is allowed to read. */
export function normalizeSource(value: string): string | null {
  const text = value.replace(/\u0000/g, "").trim().slice(0, MAX_SOURCE);
  if (text.length < MIN_SOURCE) return null;
  return text;
}

export function sourceNotes(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 40)
    .map((line) => line.slice(0, 500));
}
