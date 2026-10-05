import "server-only";
import { askModelText } from "@/lib/explain/judge";
import type { LearnerNoteView } from "@/lib/explain/notes-view";

const SYSTEM = [
  "You summarize one learner's notes for a single stage.",
  "Use only the notes in the message. Do not add facts, examples, or advice that are not written there.",
  "If the notes are thin, say that in one sentence and stop.",
  "Write two to five sentences of plain text. No title, no list, no score.",
].join(" ");

/** A short restatement of this stage's notes. Nothing outside those notes is allowed in. */
export async function summarizeStageNotes(input: { stageTitle: string; notes: Pick<LearnerNoteView, "concept" | "explanation" | "review">[] }): Promise<string | null> {
  if (input.notes.length === 0) return null;
  const body = input.notes
    .map((note, index) => `${index + 1}. ${note.concept}\nWhat they wrote: ${note.explanation}\nReview: ${note.review}`)
    .join("\n\n")
    .slice(0, 12_000);
  return askModelText(SYSTEM, `Stage: ${input.stageTitle}\n\n${body}`);
}
