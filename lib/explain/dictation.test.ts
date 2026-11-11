import { describe, expect, it } from "vitest";
import { answerMethod, appendSpoken, cleanMethod, dictationErrorText, dictationLang, stageMethod } from "@/lib/explain/dictation";

describe("speaking an explanation", () => {
  it("joins spoken phrases onto the draft with one space and a capital where a sentence starts", () => {
    expect(appendSpoken("", "a variable holds a value")).toBe("A variable holds a value");
    expect(appendSpoken("A variable holds a value", "so you can use it later")).toBe("A variable holds a value so you can use it later");
    expect(appendSpoken("It holds a value.", "you name it once")).toBe("It holds a value. You name it once");
    expect(appendSpoken("It holds a value.  ", "  you   name it ")).toBe("It holds a value. You name it");
    expect(appendSpoken("Keep this", "   ")).toBe("Keep this");
  });

  it("labels an answer by how much of it was spoken", () => {
    expect(answerMethod("", 0)).toBe("text");
    expect(answerMethod("typed every word of this", 0)).toBe("text");
    expect(answerMethod("all of this was said out loud", 29)).toBe("voice");
    expect(answerMethod("half spoken and half typed here", 15)).toBe("mixed");
    expect(answerMethod("one word spoken in a long typed answer here", 3)).toBe("text");
    // Spoken text that was later trimmed still counts as voice, never above 100%.
    expect(answerMethod("short", 40)).toBe("voice");
  });

  it("labels a stage from its ideas", () => {
    expect(stageMethod([])).toBe("text");
    expect(stageMethod(["voice", "voice"])).toBe("voice");
    expect(stageMethod(["text", "text"])).toBe("text");
    expect(stageMethod(["voice", "text"])).toBe("mixed");
  });

  it("stores anything unexpected from the browser as typed text", () => {
    expect(cleanMethod("voice")).toBe("voice");
    expect(cleanMethod("mixed")).toBe("mixed");
    expect(cleanMethod("telepathy")).toBe("text");
    expect(cleanMethod(undefined)).toBe("text");
  });

  it("listens in the browser's language, with a safe default", () => {
    expect(dictationLang("hi-IN")).toBe("hi-IN");
    expect(dictationLang("en")).toBe("en");
    expect(dictationLang("")).toBe("en-IN");
    expect(dictationLang("not a language!")).toBe("en-IN");
  });

  it("explains a blocked microphone in plain words and stays quiet when nobody spoke", () => {
    expect(dictationErrorText("no-speech")).toBeNull();
    expect(dictationErrorText("aborted")).toBeNull();
    expect(dictationErrorText("not-allowed")).toMatch(/blocked/);
    expect(dictationErrorText("something-new")).toMatch(/Try again/);
  });
});
