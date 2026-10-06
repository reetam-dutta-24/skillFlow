import { describe, expect, it } from "vitest";
import { parseRecallReview, recallDue, retentionFactor, RECALL_GAP_MS } from "@/lib/explain/recall";

const HOUR = 60 * 60 * 1000;

describe("recall schedule", () => {
  const passedAt = new Date("2026-10-01T08:00:00.000Z");

  it("waits 18 hours after the pass, then asks", () => {
    expect(recallDue({ passedAt, answeredAt: [], now: new Date(passedAt.getTime() + 18 * HOUR - 1) })).toBe(false);
    expect(recallDue({ passedAt, answeredAt: [], now: new Date(passedAt.getTime() + RECALL_GAP_MS) })).toBe(true);
  });

  it("asks a second time 18 hours after the first answer, then stops", () => {
    const first = new Date(passedAt.getTime() + RECALL_GAP_MS);
    expect(recallDue({ passedAt, answeredAt: [first], now: new Date(first.getTime() + 18 * HOUR - 1) })).toBe(false);
    expect(recallDue({ passedAt, answeredAt: [first], now: new Date(first.getTime() + RECALL_GAP_MS) })).toBe(true);
    expect(
      recallDue({
        passedAt,
        answeredAt: [first, new Date(first.getTime() + RECALL_GAP_MS)],
        now: new Date("2026-12-01T00:00:00.000Z"),
      }),
    ).toBe(false);
  });
});

describe("retention factor", () => {
  it("stays empty until the first answer, then averages the scores", () => {
    expect(retentionFactor([])).toBeNull();
    expect(retentionFactor([100])).toBe(100);
    expect(retentionFactor([100, 20])).toBe(60);
    expect(retentionFactor([55, 55, 20])).toBe(43);
  });
});

describe("recall review parse", () => {
  it("keeps a real review and fills a short one", () => {
    const written = "You kept the idea. The key light sets the shape, and the fill light opens the shadow so the face stays readable.";
    expect(parseRecallReview({ quality: "strong", review: written })).toMatchObject({ quality: "strong", score: 100, review: written });
    const thin = parseRecallReview({ quality: "weak", review: "No." });
    expect(thin?.quality).toBe("weak");
    expect(thin?.score).toBe(20);
    expect(thin?.review.length).toBeGreaterThan(40);
    expect(parseRecallReview({ understood: true })).toBeNull();
  });
});
