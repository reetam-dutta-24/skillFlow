import { describe, expect, it } from "vitest";
import { feedbackForGaps, followUpForGaps, stageConcepts } from "@/lib/explain/concepts";
import { decideExplainBack, explainModelConfig, parseConceptReview, parseJudgeReply } from "@/lib/explain/judge";
import { stepsFromNotes } from "@/lib/explain/wizard";

const CONCEPTS = [
  "Box model and box-sizing",
  "Cascade and specificity",
  "Flexbox",
  "Grid",
  "Responsive design with media queries",
];

function reply(understood: boolean[]) {
  return {
    concepts: CONCEPTS.map((name, index) => ({ name, understood: understood[index] })),
    followUp: "Explain cascade and specificity: what wins when two rules disagree, and why.",
    feedback: "Flexbox and Grid are in place. Cascade is still missing.",
  };
}

describe("stage concepts", () => {
  it("uses every learning objective, and the rubric only when a stage has none", () => {
    expect(stageConcepts(["Flexbox", " Grid "], ["unused", "flexbox"])).toEqual(["Flexbox", "Grid", "Unused"]);
    expect(stageConcepts([], [" Names the box model "])).toEqual(["Box model"]);
  });
});

describe("judge replies", () => {
  it("keeps a reply lined up with the stage concepts", () => {
    const parsed = parseJudgeReply(JSON.stringify(reply([true, false, true, true, true])), CONCEPTS);
    expect(parsed?.marks.map((mark) => mark.understood)).toEqual([true, false, true, true, true]);
  });

  it("drops JSON that is not a concept list", () => {
    expect(parseJudgeReply("nope", CONCEPTS)).toBeNull();
    expect(parseJudgeReply({ concepts: [] }, CONCEPTS)).toBeNull();
    expect(parseJudgeReply({ feedback: "nice" }, CONCEPTS)).toBeNull();
  });

  it("passes only when every concept is understood", () => {
    const full = parseJudgeReply(reply([true, true, true, true, true]), CONCEPTS);
    expect(full && decideExplainBack(full, "first").kind).toBe("pass");
  });

  it("asks about the gap first, then refuses a pass if the gap remains", () => {
    const partial = parseJudgeReply(reply([true, false, true, true, false]), CONCEPTS);
    if (!partial) throw new Error("expected a reply");
    const first = decideExplainBack(partial, "first");
    expect(first.kind).toBe("follow-up");
    if (first.kind === "follow-up") expect(first.question).toContain("cascade");
    const again = decideExplainBack({ ...partial, followUp: "" }, "final");
    expect(again.kind).toBe("needs-improvement");
    if (again.kind === "needs-improvement") {
      expect(again.feedback).toContain("Cascade and specificity");
      expect(again.feedback).toContain("Responsive design with media queries");
    }
  });

  it("writes a follow-up that names every missing idea when the model leaves it blank", () => {
    const question = followUpForGaps([
      { concept: "Flexbox", understood: true },
      { concept: "Cascade and specificity", understood: false },
      { concept: "Grid", understood: false },
    ]);
    expect(question).toContain("Cascade and specificity");
    expect(question).toContain("Grid");
    expect(feedbackForGaps([{ concept: "Flexbox", understood: false }])).toContain("stays open");
  });
});

describe("model config", () => {
  it("stays off until a key is set, and defaults to an OpenAI chat endpoint", () => {
    expect(explainModelConfig({})).toBeNull();
    expect(explainModelConfig({ GEMINI_API_KEY: "test-key" })).toMatchObject({
      provider: "gemini",
      key: "test-key",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      model: "gemini-flash-lite-latest",
    });
    expect(explainModelConfig({ OPENAI_API_KEY: "test-key" })).toMatchObject({
      provider: "openai",
      key: "test-key",
      url: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
    });
    expect(explainModelConfig({ GEMINI_API_KEY: "gemini", OPENAI_API_KEY: "openai" })?.model).toBe("gemini-flash-lite-latest");
    const custom = explainModelConfig({
      EXPLAIN_MODEL_KEY: "other",
      EXPLAIN_MODEL_URL: "https://example.com/v1/chat/completions",
      EXPLAIN_MODEL_NAME: "gpt-4o",
    });
    expect(custom?.model).toBe("gpt-4o");
  });
});

describe("concept review", () => {
  it("keeps a written review when the idea holds and when it does not", () => {
    const held = parseConceptReview({
      understood: true,
      review: "You explained a value as the data a program holds, and a type as the rules for what you can do with it. The sharper point is that JavaScript still runs when the type is wrong.",
    });
    expect(held?.understood).toBe(true);
    expect(held?.review).toMatch(/sharper point/);

    const retry = parseConceptReview({ understood: false, review: "Too short." });
    expect(retry?.understood).toBe(false);
    expect(retry?.review.length).toBeGreaterThan(40);
    expect(retry?.review).not.toBe("Too short.");
    expect(parseConceptReview("not json")).toBeNull();
    expect(parseConceptReview('{"understood":true,"review":string}')).toBeNull();
    expect(parseConceptReview({ understood: "false", review: "You named the idea and stopped. Say what a value is, and what a type changes about how you use it." })?.understood).toBe(false);
  });

  it("reads the model's generated opinion only when it says yes outright", () => {
    const review = "You explained what a value is and why the type changes what you can do with it.";
    expect(parseConceptReview({ understood: true, review, generated: true })?.generated).toBe(true);
    expect(parseConceptReview({ understood: true, review, generated: "yes" })?.generated).toBe(true);
    expect(parseConceptReview({ understood: true, review })?.generated).toBe(false);
    expect(parseConceptReview({ understood: true, review, generated: "maybe" })?.generated).toBe(false);
  });

  it("records the stage only from ideas the server accepted, every one of them, in stage order", () => {
    const concepts = ["Values", "Functions"];
    const review = "You explained what a value is and why the type changes what you can do with it.";
    // One idea has no accepted note yet: the stage cannot be recorded.
    expect(stepsFromNotes(concepts, [{ concept: "Values", explanation: "A value is data.", review }])).toBeNull();
    // An accepted note with no real review does not count.
    expect(
      stepsFromNotes(concepts, [
        { concept: "Values", explanation: "A value is data.", review },
        { concept: "Functions", explanation: "A function is a reusable step.", review: "ok" },
      ]),
    ).toBeNull();
    // Notes come back in any order; the steps follow the stage.
    const steps = stepsFromNotes(concepts, [
      { concept: "Functions", explanation: "A function groups steps you can run again.", review },
      { concept: "Values", explanation: "A value is data the program holds.", review },
      { concept: "Something else", explanation: "Not part of this stage.", review },
    ]);
    expect(steps?.map((step) => step.concept)).toEqual(["Values", "Functions"]);
    expect(stepsFromNotes([], [])).toBeNull();
  });
});
