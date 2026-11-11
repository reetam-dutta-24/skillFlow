export type WizardStep = {
  concept: string;
  answer: string;
  review: string;
};

/** One idea the server already accepted: a stage `LearnerNote`, written only after the model marked it understood. */
export type AcceptedIdea = {
  concept: string;
  explanation: string;
  review: string;
};

/**
 * The stage's steps, in order, built only from ideas the server accepted. Null while any idea has no accepted note.
 * The browser never supplies the answer or the review that records a stage, so a stage cannot be passed by posting
 * made-up reviews to the finish action.
 */
export function stepsFromNotes(concepts: string[], accepted: AcceptedIdea[]): WizardStep[] | null {
  if (concepts.length === 0) return null;
  const byConcept = new Map(accepted.map((note) => [note.concept.trim(), note]));
  const steps: WizardStep[] = [];
  for (const concept of concepts) {
    const note = byConcept.get(concept.trim());
    const answer = note?.explanation.trim().slice(0, 4000) ?? "";
    const review = note?.review.trim().slice(0, 900) ?? "";
    if (!answer || review.length < 20) return null;
    steps.push({ concept, answer, review });
  }
  return steps;
}
