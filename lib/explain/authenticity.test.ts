import { describe, expect, it } from "vitest";
import {
  WARNING_STRIKES,
  assessAuthenticity,
  cleanTrace,
  integrityOutcome,
  nextFlagBlocks,
  textSignals,
  traceSignals,
} from "@/lib/explain/authenticity";

const CASUAL =
  "a variable is like a box with a name on it, you put a value in and later you use the name to get it back. its useful because you dont have to repeat the value everywhere and if it changes you change it in one place";
const SECOND_LANGUAGE =
  "Variable is the name which keep the value. When program is running we can change value of variable, so we use it for store the data like age of user and then show it on screen after.";
const CHATBOT =
  "Certainly! Here's a clear explanation of variables.\n\n**Variables** serve as named containers for data.\n- They store values\n- They can be updated later\n\nIn summary, variables play a crucial role in programming. I hope this helps!";
const STOCK =
  "A variable serves as a named reference to a value in memory. Furthermore, it plays a crucial role in keeping programs readable, because the same value can be reused. In essence, naming a value ensures that later changes happen in one place across the whole program.";

describe("text signals", () => {
  it("finds nothing in a casual answer or in second-language English", () => {
    expect(textSignals(CASUAL).score).toBe(0);
    expect(textSignals(SECOND_LANGUAGE).score).toBe(0);
  });

  it("treats a chatbot phrase as decisive, even in a short answer", () => {
    expect(textSignals(CHATBOT).chatbot).toBe(true);
    expect(textSignals(CHATBOT).score).toBe(1);
    expect(textSignals("As an AI, I would say a variable stores data.").chatbot).toBe(true);
  });

  it("adds up stock phrases without flagging on them alone", () => {
    const signals = textSignals(STOCK);
    expect(signals.score).toBeGreaterThanOrEqual(0.3);
    expect(signals.score).toBeLessThan(0.7);
  });

  it("does not judge the style of a short answer", () => {
    expect(textSignals("- holds a value\n- has a name").score).toBe(0);
  });
});

describe("typing trace", () => {
  it("accepts only sane counts from the browser", () => {
    expect(cleanTrace({ typed: 120, pasted: 0, activeMs: 40_000 })).toEqual({ typed: 120, pasted: 0, activeMs: 40_000 });
    expect(cleanTrace({ typed: -1, pasted: 0, activeMs: 10 })).toBeNull();
    expect(cleanTrace({ typed: "lots" })).toBeNull();
    expect(cleanTrace(null)).toBeNull();
  });

  it("notices a pasted answer and impossible typing speed, but not for a spoken answer", () => {
    const answer = CASUAL;
    expect(traceSignals(answer, { typed: 5, pasted: answer.length - 5, activeMs: 3000 }, "text").pasted).toBe(true);
    expect(traceSignals(answer, { typed: 5, pasted: answer.length - 5, activeMs: 3000 }, "voice").pasted).toBe(false);
    expect(traceSignals(answer, { typed: 300, pasted: 0, activeMs: 10_000 }, "text").fast).toBe(true);
    expect(traceSignals(answer, { typed: 300, pasted: 0, activeMs: 90_000 }, "text").fast).toBe(false);
  });
});

describe("one decision", () => {
  it("never flags an honest answer on the model's opinion alone", () => {
    for (const answer of [CASUAL, SECOND_LANGUAGE]) {
      expect(assessAuthenticity({ answer, method: "text", trace: null, modelSaysGenerated: true }).flagged).toBe(false);
    }
  });

  it("flags a chatbot reply and a pasted answer without needing the model", () => {
    expect(assessAuthenticity({ answer: CHATBOT, method: "text", trace: null, modelSaysGenerated: null }).flagged).toBe(true);
    const pasted = assessAuthenticity({
      answer: CASUAL,
      method: "text",
      trace: { typed: 0, pasted: CASUAL.length, activeMs: 2000 },
      modelSaysGenerated: false,
    });
    expect(pasted.flagged).toBe(true);
    expect(pasted.reasons.join(" ")).toMatch(/pasted/);
  });

  it("flags polished stock prose only when the model agrees", () => {
    expect(assessAuthenticity({ answer: STOCK, method: "text", trace: null, modelSaysGenerated: false }).flagged).toBe(false);
    const agreed = assessAuthenticity({ answer: STOCK, method: "text", trace: null, modelSaysGenerated: true });
    expect(agreed.flagged).toBe(true);
    expect(agreed.reasons.length).toBeGreaterThan(0);
    expect(agreed.reasons.length).toBeLessThanOrEqual(3);
  });

  it("flags superhuman typing only together with another signal", () => {
    // 300 characters in 4 seconds: 75 a second, far past any typist.
    const trace = { typed: 300, pasted: 0, activeMs: 4000 };
    expect(assessAuthenticity({ answer: CASUAL, method: "text", trace, modelSaysGenerated: false }).flagged).toBe(false);
    expect(assessAuthenticity({ answer: CASUAL, method: "text", trace, modelSaysGenerated: true }).flagged).toBe(true);
  });
});

describe("strikes on a stage", () => {
  it("warns twice, then stops accepting flagged answers", () => {
    expect(WARNING_STRIKES).toBe(2);
    expect(integrityOutcome(0, false)).toEqual({ status: "clear", strikes: 0, warningsLeft: 2 });
    expect(integrityOutcome(0, true)).toEqual({ status: "warning", strikes: 1, warningsLeft: 1 });
    expect(integrityOutcome(1, true)).toEqual({ status: "warning", strikes: 2, warningsLeft: 0 });
    expect(integrityOutcome(2, true)).toEqual({ status: "blocked", strikes: 3, warningsLeft: 0 });
    expect(integrityOutcome(5, true).status).toBe("blocked");
  });

  it("lets an answer in the learner's own words through even after the warnings are used up", () => {
    expect(integrityOutcome(3, false).status).toBe("clear");
  });

  it("knows when a clear-cut flag can be refused before any model call", () => {
    expect(nextFlagBlocks(1)).toBe(false);
    expect(nextFlagBlocks(2)).toBe(true);
  });
});
