import { describe, expect, it } from "vitest";
import { pathIsComplete, recordDate, transcriptBlocks } from "@/lib/records/format";

describe("path records", () => {
  it("dates a pass in UTC and treats a full path as complete", () => {
    expect(recordDate(new Date("2026-10-06T23:30:00.000Z"))).toBe("Oct 6, 2026");
    expect(recordDate(null)).toBe("Passed");
    expect(pathIsComplete(12, 12)).toBe(true);
    expect(pathIsComplete(12, 9)).toBe(false);
    expect(pathIsComplete(0, 0)).toBe(false);
    expect(
      transcriptBlocks({
        learnerName: "Ava",
        skillName: "Content Creation",
        passedCount: 1,
        stageCount: 10,
        stages: [
          { order: 1, title: "Lighting", passed: true, when: "Oct 6, 2026" },
          { order: 2, title: "Audio", passed: false, when: "" },
        ],
      }),
    ).toEqual(["SkillFlow transcript", "Ava", "Content Creation", "1 of 10 stages passed", "Stage 1. Lighting", "Oct 6, 2026"]);
  });
});
