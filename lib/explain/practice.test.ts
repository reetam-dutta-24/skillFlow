import { describe, expect, it } from "vitest";
import { normalizeSource, practiceKey, practiceStageId, sourceNotes } from "@/lib/explain/practice";

describe("practice notes", () => {
  it("keys a practice idea to the learner and the niche, not a stage", () => {
    expect(practiceStageId("skill_1")).toBe("practice:skill_1");
    expect(practiceKey("user_1", "skill_1", " Box model ")).toBe("user_1:skill_1:box model");
  });

  it("keeps only enough of the learner's text to grade against", () => {
    expect(normalizeSource("  too short  ")).toBeNull();
    expect(normalizeSource(`${"a".repeat(39)}`)).toBeNull();
    expect(normalizeSource(`${"A line about the box model. ".repeat(4)}`)?.startsWith("A line")).toBe(true);
    expect(sourceNotes("Key light\n\nFill light")).toEqual(["Key light", "Fill light"]);
  });
});
