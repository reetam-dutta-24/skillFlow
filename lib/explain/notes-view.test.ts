import { describe, expect, it } from "vitest";
import { arrangeNotes, type LearnerNoteView } from "@/lib/explain/notes-view";

function note(patch: Partial<LearnerNoteView> & Pick<LearnerNoteView, "id" | "concept">): LearnerNoteView {
  return {
    skillName: "Full-Stack Web Development",
    stageId: "stage-js",
    stageTitle: "JavaScript Fundamentals",
    stageOrder: 3,
    explanation: "What I wrote.",
    review: "What came back.",
    position: 0,
    updatedAt: "2026-10-06T00:00:00.000Z",
    updatedLabel: "6 Oct 2026",
    ...patch,
  };
}

describe("arrange notes", () => {
  it("keeps ideas in the order they were asked, and stages in path order", () => {
    const groups = arrangeNotes([
      note({ id: "fn", concept: "Functions", position: 1, stageOrder: 3 }),
      note({ id: "values", concept: "Values and types", position: 0, stageOrder: 3 }),
      note({
        id: "box",
        concept: "Box model",
        stageId: "stage-css",
        stageTitle: "CSS Layout",
        stageOrder: 2,
        position: 0,
        updatedAt: "2026-10-01T00:00:00.000Z",
        updatedLabel: "1 Oct 2026",
      }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].stages.map((stage) => stage.stageTitle)).toEqual(["CSS Layout", "JavaScript Fundamentals"]);
    expect(groups[0].stages[1].notes.map((item) => item.concept)).toEqual(["Values and types", "Functions"]);
  });
});
