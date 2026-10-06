/** Hours between a passed idea and its first recall, and between the two recalls. */
export const RECALL_GAP_MS = 18 * 60 * 60 * 1000;

/** A passed idea is asked twice, then it stops. */
export const RECALL_LIMIT = 2;

export const RECALL_HOLD_COOKIE = "skillflow-recall-hold";

export const RECALL_SCORES = { strong: 100, partial: 55, weak: 20 } as const;

export type RecallQuality = keyof typeof RECALL_SCORES;

const MIN_REVIEW = 40;

const FALLBACK_REVIEW: Record<RecallQuality, string> = {
  strong: "That explanation holds. You said what the idea is and why it matters, in your own words. Keep that version.",
  partial: "Part of that is right, and a real part is missing. The idea is what it is, and when you would use it. The missing part is the one to keep.",
  weak: "That does not yet explain the idea. It is what the stage asked you to teach back: what it is, and why it matters when you use it.",
};

export function recallDue(input: { passedAt: Date; answeredAt: Date[]; now: Date }): boolean {
  if (input.answeredAt.length >= RECALL_LIMIT) return false;
  const from = input.answeredAt[input.answeredAt.length - 1] ?? input.passedAt;
  return input.now.getTime() - from.getTime() >= RECALL_GAP_MS;
}

/** Average of recall scores, from 0 to 100. No answers yet means no factor. */
export function retentionFactor(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / scores.length);
}

export function qualityLabel(quality: RecallQuality): string {
  if (quality === "strong") return "This answer holds.";
  if (quality === "partial") return "This answer is partial.";
  return "This answer is thin.";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function qualityOf(value: unknown): RecallQuality | null {
  if (typeof value !== "string") return null;
  const text = value.trim().toLowerCase();
  if (text === "strong" || text === "partial" || text === "weak") return text;
  return null;
}

/** A written recall review. A short review is replaced so the card never returns only a label. */
export function parseRecallReview(raw: unknown): { quality: RecallQuality; review: string; score: number } | null {
  let data: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      data = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  const record = asRecord(data);
  if (!record) return null;
  const nested = asRecord(record.result) ?? record;
  const quality = qualityOf(nested.quality ?? record.quality);
  if (!quality) return null;
  const reviewSource = [nested.review, record.review, nested.explanation, record.explanation].find((item) => typeof item === "string");
  const given = typeof reviewSource === "string" ? reviewSource.trim().slice(0, 900) : "";
  return {
    quality,
    score: RECALL_SCORES[quality],
    review: given.length >= MIN_REVIEW ? given : FALLBACK_REVIEW[quality],
  };
}
