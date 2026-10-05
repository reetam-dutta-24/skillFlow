import { describe, expect, it } from "vitest";
import { parseModelGrade } from "@/lib/explain/model";
import { coverRubric, feedbackFor, followUpFor, passesRubric } from "@/lib/explain/rubric";

const FLEXBOX = [
  "Explains Flexbox as one-dimensional (a row or a column) and Grid as two-dimensional (rows and columns)",
  "Names the box model layers: content, padding, border, margin",
  "Explains that box-sizing: border-box includes padding and border in the declared width",
  "Explains making layouts responsive with media queries or intrinsic, flexible sizing",
];

const GOOD =
  "Flexbox lays out one row or column, while Grid lays out rows and columns together. The box model is content, padding, border, and margin. With border-box, the declared width includes padding and border.";

const THIN = "I think CSS is used to make a page look nicer than plain text.";

describe("rubric coverage", () => {
  it("covers the ideas a full answer actually names", () => {
    const covered = coverRubric(GOOD, FLEXBOX);
    expect(covered).toEqual([true, true, true, false]);
    expect(passesRubric(covered)).toBe(true);
  });

  it("leaves a thin answer uncovered", () => {
    const covered = coverRubric(THIN, FLEXBOX);
    expect(covered.every((item) => item === false)).toBe(true);
    expect(passesRubric(covered)).toBe(false);
  });

  it("asks about the first missing line, then accepts a later mention", () => {
    const first = coverRubric(GOOD, FLEXBOX);
    expect(followUpFor(FLEXBOX, first)).toContain("media queries");
    const combined = coverRubric(`${GOOD}\nMedia queries change the layout as the screen gets narrower.`, FLEXBOX);
    expect(combined[3]).toBe(true);
    expect(passesRubric(combined)).toBe(true);
  });

  it("ignores an answer that is only a few words", () => {
    expect(coverRubric("grid flexbox", FLEXBOX).some(Boolean)).toBe(false);
  });

  it("writes a pass or a miss in plain words", () => {
    const covered = coverRubric(GOOD, FLEXBOX);
    expect(feedbackFor(FLEXBOX, covered, true)).toContain("That covers the check");
    expect(feedbackFor(FLEXBOX, covered.map(() => false), false)).toContain("Still missing");
  });
});

describe("model replies", () => {
  it("keeps a reply whose verdict matches the coverage", () => {
    const grade = parseModelGrade(
      JSON.stringify({
        covered: [true, true, false, false],
        verdict: "PASSED",
        feedback: "You named Flexbox and the box model.",
      }),
      4,
    );
    expect(grade?.verdict).toBe("PASSED");
  });

  it("drops bad JSON, a short list, and a verdict that disagrees", () => {
    expect(parseModelGrade("not json", 4)).toBeNull();
    expect(parseModelGrade({ covered: [true], verdict: "PASSED", feedback: "ok" }, 4)).toBeNull();
    expect(
      parseModelGrade(
        { covered: [false, false, false, false], verdict: "PASSED", feedback: "Looks good." },
        4,
      ),
    ).toBeNull();
  });
});
