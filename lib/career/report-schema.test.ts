import { describe, expect, it } from "vitest";
import { reportSchema } from "./report-schema";

const base = {
  summary: "Your interests lean creative and your traits sit near the middle on most scales.",
  workStyle: "You do well in quiet, creative settings where you set the pace.",
  strengths: [1, 2, 3].map((n) => ({ title: `Strength ${n}`, detail: "A detail long enough to pass the check." })),
  watchOuts: [
    { title: "One", detail: "A detail long enough to pass." },
    { title: "Two", detail: "Another detail long enough." },
  ],
  paths: [
    {
      slug: "chess",
      why: "Because the interests line up well with this path.",
      approach: ["Open stage 1 now.", "Pass its explain-back.", "Set a personal plan."],
      firstWeek: "Finish stage 1 this week.",
    },
  ],
  growth: ["Retake the test in six months.", "Share one thing on Open Source."],
};

describe("career-fit report schema", () => {
  it("accepts growth tips written as objects", () => {
    const parsed = reportSchema.safeParse({ ...base, growth: [{ title: "Retake", detail: "Retake the test in six months." }, "Share one thing on Open Source."] });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.growth[0]).toBe("Retake: Retake the test in six months.");
  });

  it("cuts over-long text and extra entries instead of failing", () => {
    const strengths = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ title: `Strength ${n}`, detail: "A detail long enough to pass the check." }));
    const parsed = reportSchema.safeParse({ ...base, summary: "y".repeat(2000), strengths });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.summary).toHaveLength(900);
      expect(parsed.data.strengths).toHaveLength(6);
    }
  });

  it("still rejects a reply that is missing whole sections", () => {
    expect(reportSchema.safeParse({ ...base, strengths: [] }).success).toBe(false);
    expect(reportSchema.safeParse({ summary: base.summary }).success).toBe(false);
  });
});
