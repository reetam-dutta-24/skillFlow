"use server";

import { auth } from "@/lib/auth";
import { explainModelConfig } from "@/lib/explain/judge";
import { listLearnerNotes } from "@/lib/explain/notes";
import { summarizeStageNotes } from "@/lib/explain/summarize";

export async function summarizeStage(stageId: string): Promise<
  { ok: true; summary: string } | { ok: false; error: "empty" | "unavailable" | "unconnected" }
> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !stageId) return { ok: false, error: "unavailable" };
  if (!explainModelConfig()) return { ok: false, error: "unconnected" };

  const notes = (await listLearnerNotes(userId)).filter((note) => note.stageId === stageId);
  if (notes.length === 0) return { ok: false, error: "empty" };
  const summary = await summarizeStageNotes({ stageTitle: notes[0].stageTitle, notes });
  if (!summary) return { ok: false, error: "unavailable" };
  return { ok: true, summary };
}
