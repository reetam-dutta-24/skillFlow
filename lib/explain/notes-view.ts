export type LearnerNoteView = {
  id: string;
  skillName: string;
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

export type NoteGroup = {
  skillName: string;
  stages: {
    stageId: string;
    stageTitle: string;
    notes: LearnerNoteView[];
  }[];
};

/** Newest skill first. Stages stay in path order. Ideas stay in the order they were asked. */
export function arrangeNotes(notes: LearnerNoteView[]): NoteGroup[] {
  const skills = new Map<string, { skillName: string; latest: string; stages: Map<string, { stageId: string; stageTitle: string; stageOrder: number; notes: LearnerNoteView[] }> }>();
  for (const note of notes) {
    const skill = skills.get(note.skillName) ?? { skillName: note.skillName, latest: note.updatedAt, stages: new Map() };
    if (note.updatedAt > skill.latest) skill.latest = note.updatedAt;
    const stage = skill.stages.get(note.stageId) ?? { stageId: note.stageId, stageTitle: note.stageTitle, stageOrder: note.stageOrder, notes: [] };
    stage.notes.push(note);
    skill.stages.set(note.stageId, stage);
    skills.set(note.skillName, skill);
  }
  return [...skills.values()]
    .sort((a, b) => (a.latest < b.latest ? 1 : a.latest > b.latest ? -1 : a.skillName.localeCompare(b.skillName)))
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
