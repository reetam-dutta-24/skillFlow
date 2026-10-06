import { describe, expect, it } from "vitest";
import { mergeResourceTags } from "@/lib/plan/tags";

const empty = { durationMinutes: null, depth: null, isCore: false, captionLanguages: [] as string[] };

describe("resource tag merge", () => {
  it("does not replace a value an admin saved", () => {
    const merged = mergeResourceTags(
      { ...empty, durationMinutes: 18 },
      { durationMinutes: "admin" },
      { durationMinutes: 40, depth: "INTRO" },
      "model",
    );
    expect(merged.tags.durationMinutes).toBe(18);
    expect(merged.tags.depth).toBe("INTRO");
    expect(merged.origins.depth).toBe("model");
  });
});
