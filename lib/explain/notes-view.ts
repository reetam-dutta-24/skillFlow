export type LearnerNoteView = {
  id: string;
  skillName: string;
  skillOrder: number;
  stageId: string;
  stageTitle: string;
  stageOrder: number;
  concept: string;
  explanation: string;
  review: string;
  position: number;
  updatedAt: string;
  updatedLabel: string;
};

export type PassedNoteStep = {
  concept: string;
  explanation: string;
  review: string;
  position: number;
};

function blocks(text: string) {
  return text.split(/\n\n+/).map((part) => part.trim()).filter(Boolean);
}

function headAndBody(block: string) {
  const breakAt = block.indexOf("\n");
  if (breakAt === -1) return { head: block.trim(), body: "" };
  return { head: block.slice(0, breakAt).trim(), body: block.slice(breakAt + 1).trim() };
}

/** Turn a stored pass into one note per idea, or one note for the whole stage. */
export function notesFromPassedAttempt(input: {
  stageTitle: string;
  explanation: string;
  feedback: string;
}): PassedNoteStep[] {
  const explanation = input.explanation.trim();
  const feedback = input.feedback.trim();
  if (!explanation) return [];
  const fallbackReview = feedback || "This stage was recorded.";
  const expBlocks = blocks(explanation);
  const revBlocks = blocks(feedback);

  if (expBlocks.length >= 2 && expBlocks.length === revBlocks.length) {
    const steps = expBlocks.map((block, index) => {
      const written = headAndBody(block);
      const reviewed = headAndBody(revBlocks[index]);
      const sameHead = reviewed.head === written.head;
      const review = (sameHead ? reviewed.body : revBlocks[index]).trim();
      return {
        concept: written.head,
        explanation: (written.body || written.head).trim(),
        review: review || fallbackReview,
        position: index,
      };
    });
    if (steps.every((step) => step.concept && step.explanation && step.review.length >= 20)) return steps;
  }

  const single = headAndBody(explanation);
  if (single.head === input.stageTitle.trim() && single.body) {
    return [{ concept: input.stageTitle.trim(), explanation: single.body, review: fallbackReview, position: 0 }];
  }
  return [{ concept: input.stageTitle.trim() || "Explain-back", explanation, review: fallbackReview, position: 0 }];
}

export type NoteGroup = {
  skillName: string;
  stages: {
    stageId: string;
    stageTitle: string;
    notes: LearnerNoteView[];
  }[];
};

/** Skills follow the catalog. Stages stay in path order. Ideas stay in the order they were asked. */
export function arrangeNotes(notes: LearnerNoteView[]): NoteGroup[] {
  const skills = new Map<string, { skillName: string; skillOrder: number; stages: Map<string, { stageId: string; stageTitle: string; stageOrder: number; notes: LearnerNoteView[] }> }>();
  for (const note of notes) {
    const skill = skills.get(note.skillName) ?? { skillName: note.skillName, skillOrder: note.skillOrder, stages: new Map() };
    const stage = skill.stages.get(note.stageId) ?? { stageId: note.stageId, stageTitle: note.stageTitle, stageOrder: note.stageOrder, notes: [] };
    stage.notes.push(note);
    skill.stages.set(note.stageId, stage);
    skills.set(note.skillName, skill);
  }
  return [...skills.values()]
    .sort((a, b) => a.skillOrder - b.skillOrder || a.skillName.localeCompare(b.skillName))
    .map((skill) => ({
      skillName: skill.skillName,
      stages: [...skill.stages.values()]
        .sort((a, b) => a.stageOrder - b.stageOrder)
        .map((stage) => ({
          stageId: stage.stageId,
          stageTitle: stage.stageTitle,
          notes: [...stage.notes].sort((a, b) => a.position - b.position),
        })),
    }));
}
