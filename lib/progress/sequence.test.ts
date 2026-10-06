import { describe, expect, it } from "vitest";
import { stageOpenForLearner } from "@/lib/progress/sequence";

const stages = [
  { id: "a", open: true },
  { id: "b", open: true },
  { id: "c", open: true },
  { id: "tail", open: false },
];

describe("stage sequence", () => {
  it("opens the first stage and keeps the tail shut", () => {
    const passed = new Set<string>();
    expect(stageOpenForLearner(stages, 0, passed)).toBe(true);
    expect(stageOpenForLearner(stages, 1, passed)).toBe(false);
    expect(stageOpenForLearner(stages, 3, passed)).toBe(false);
  });

  it("opens the next stage only after the previous one is passed", () => {
    const passed = new Set(["a"]);
    expect(stageOpenForLearner(stages, 1, passed)).toBe(true);
    expect(stageOpenForLearner(stages, 2, passed)).toBe(false);
  });

  it("keeps a later pass that was recorded before the sequence", () => {
    const passed = new Set(["c"]);
    expect(stageOpenForLearner(stages, 0, passed)).toBe(true);
    expect(stageOpenForLearner(stages, 1, passed)).toBe(false);
    expect(stageOpenForLearner(stages, 2, passed)).toBe(true);
  });
});
