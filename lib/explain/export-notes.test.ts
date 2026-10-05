import { describe, expect, it } from "vitest";
import { noteExportBlocks } from "@/lib/explain/export-notes";
import type { LearnerNoteView } from "@/lib/explain/notes-view";

function note(partial: Partial<LearnerNoteView> & Pick<LearnerNoteView, "concept" | "explanation" | "review">): LearnerNoteView {
  return {
    id: partial.concept,
    skillName: "Content Creation",
    skillOrder: 2,
    stageId: "lighting",
    stageTitle: "Lighting for Video",
    stageOrder: 3,
    position: 0,
    updatedAt: "2026-10-06T00:00:00.000Z",
    updatedLabel: "6 Oct 2026",
    ...partial,
  };
}

describe("note export", () => {
  it("keeps the skill, the stage, and each idea in notebook order", () => {
    const blocks = noteExportBlocks([
      note({ concept: "Fill", explanation: "Softens the shadow.", review: "That holds.", position: 1 }),
      note({ concept: "Key", explanation: "The main light.", review: "That holds.", position: 0 }),
    ]);
    expect(blocks.map((block) => block.text)).toEqual([
      "Content Creation",
      "Lighting for Video",
      "Key",
      "Your note",
      "The main light.",
      "Review",
      "That holds.",
      "Fill",
      "Your note",
      "Softens the shadow.",
      "Review",
      "That holds.",
    ]);
  });
});
