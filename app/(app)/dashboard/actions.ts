"use server";

import { auth } from "@/lib/auth";
import { saveTourCompleted } from "@/lib/data/tour";

/**
 * Finish or Skip on the Home tour. Writes only the signed-in learner's own row. Personal data with no cache entry,
 * so there is nothing to invalidate; the tour component already shows "Replay the tour".
 */
export async function completeTour() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: "Sign in again before saving." };
  try {
    await saveTourCompleted(userId);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "That did not save. The tour will be offered again next time." };
  }
}
