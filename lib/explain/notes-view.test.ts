import { describe, expect, it } from "vitest";
import { arrangeNotes, notesFromPassedAttempt, type LearnerNoteView } from "@/lib/explain/notes-view";

function note(patch: Partial<LearnerNoteView> & Pick<LearnerNoteView, "id" | "concept">): LearnerNoteView {
  return {
    skillName: "Full-Stack Web Development",
    skillOrder: 2,
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

describe("notes from a recorded pass", () => {
  it("splits a stage that was saved one idea at a time", () => {
    const steps = notesFromPassedAttempt({
      stageTitle: "Lighting for Video",
      explanation: "The key light\nThe key is the main source.\n\nThe fill light\nThe fill softens the shadow.",
      feedback: "The key light\nYou placed the main source and said why it leads.\n\nThe fill light\nYou explained that the fill is dimmer and opens the shadow.",
    });
    expect(steps.map((step) => step.concept)).toEqual(["The key light", "The fill light"]);
    expect(steps[0].explanation).toBe("The key is the main source.");
    expect(steps[1].review).toMatch(/dimmer/);
  });

  it("keeps a single explanation under the stage title", () => {
    const steps = notesFromPassedAttempt({
      stageTitle: "Platforms, Formats & Specs",
      explanation: "Short-form video is vertical and made to be watched without sound.",
      feedback: "That covers the check. You named the vertical frame and why captions matter on a phone.",
    });
    expect(steps).toHaveLength(1);
    expect(steps[0].concept).toBe("Platforms, Formats & Specs");
    expect(steps[0].explanation).toMatch(/vertical/);
  });

  it("uses the text under a repeated stage title", () => {
    const steps = notesFromPassedAttempt({
      stageTitle: "Camera & Exposure",
      explanation: "Camera & Exposure\nAperture, shutter, and ISO control the exposure.",
      feedback: "You named the three controls and what each one changes in the picture.",
    });
    expect(steps[0].concept).toBe("Camera & Exposure");
    expect(steps[0].explanation).toMatch(/Aperture/);
  });
});
