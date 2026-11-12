import { describe, expect, it } from "vitest";
import {
  RETENTION_PENALTY_CAP,
  RETENTION_PENALTY_PER_FLAG,
  assessAuthenticity,
  cleanTrace,
  integrityOutcome,
  retentionPenalty,
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
  it("counts every flagged answer as a warning and never refuses one", () => {
    expect(integrityOutcome(0, false)).toEqual({ status: "clear", strikes: 0 });
    expect(integrityOutcome(0, true)).toEqual({ status: "warning", strikes: 1 });
    expect(integrityOutcome(2, true)).toEqual({ status: "warning", strikes: 3 });
    expect(integrityOutcome(9, true).status).toBe("warning");
  });

  it("leaves the count alone for an answer in the learner's own words", () => {
    expect(integrityOutcome(3, false)).toEqual({ status: "clear", strikes: 3 });
  });
});

describe("retention penalty", () => {
  it("takes 5 points per flagged answer, 40 at most", () => {
    expect(RETENTION_PENALTY_PER_FLAG).toBe(5);
    expect(RETENTION_PENALTY_CAP).toBe(40);
    expect(retentionPenalty(0)).toBe(0);
    expect(retentionPenalty(1)).toBe(5);
    expect(retentionPenalty(3)).toBe(15);
    expect(retentionPenalty(8)).toBe(40);
    expect(retentionPenalty(50)).toBe(40);
    expect(retentionPenalty(-2)).toBe(0);
  });
});
