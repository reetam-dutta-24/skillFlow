export type WizardStep = {
  concept: string;
  answer: string;
  review: string;
};

/** Keep a step only when it is the next idea, in order, with an answer and a written review. */
export function readyWizardSteps(concepts: string[], steps: WizardStep[]): WizardStep[] | null {
  if (steps.length !== concepts.length || concepts.length === 0) return null;
  const cleaned = steps.map((step) => ({
    concept: step.concept.trim(),
    answer: step.answer.trim().slice(0, 4000),
    review: step.review.trim().slice(0, 900),
  }));
  const ready = concepts.every((concept, index) => {
    const step = cleaned[index];
    return step.concept === concept && step.answer.length > 0 && step.review.length >= 40;
  });
  return ready ? cleaned : null;
}
