/** Shown on a stage the learner has not reached yet. The tail lock uses a different sentence. */
export const SEQUENCE_LOCK = "Pass the previous stage to open this one.";

/**
 * A structurally open stage stays shut until every earlier open stage is passed.
 * A stage this learner already passed stays open, so an older pass is not erased.
 */
export function stageOpenForLearner(
  stages: readonly { id: string; open: boolean }[],
  index: number,
  passedIds: ReadonlySet<string>,
): boolean {
  const stage = stages[index];
  if (!stage?.open) return false;
  if (passedIds.has(stage.id)) return true;
  for (let earlier = 0; earlier < index; earlier += 1) {
    const previous = stages[earlier];
    if (previous.open && !passedIds.has(previous.id)) return false;
  }
  return true;
}
