"use server";

import { requireAdmin } from "@/lib/require-admin";

const SAVE_MS = 600;

export async function reviewSubmission(input: { id: string; decision: "approve" | "reject"; notes: string }) {
  await requireAdmin();
  await new Promise((resolve) => setTimeout(resolve, SAVE_MS));
  if (input.notes.trim().toLowerCase() === "fail this review") {
    return { ok: false as const, error: "The review could not be saved. Try again." };
  }
  if (input.decision === "reject" && !input.notes.trim()) {
    return { ok: false as const, error: "Add a note the learner can read." };
  }
  return { ok: true as const };
}
