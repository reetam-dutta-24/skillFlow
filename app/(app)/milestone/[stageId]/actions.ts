"use server";

import { auth } from "@/lib/auth";
import { reviewMilestone } from "@/lib/data/milestone";
import { finishExplainWizard, reviewConceptStep } from "@/lib/explain/review";
import type { ExplainReview } from "@/lib/types/pages";
import { aiAllowed } from "@/lib/limits";

export async function reviewExplanation(input: {
  stageId: string;
  answer: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
}): Promise<ExplainReview> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unavailable" };
  if (!(await aiAllowed(session.user.id))) return { ok: false, error: "unavailable" };
  return reviewMilestone({ ...input, userId: session.user.id });
}

export async function reviewConcept(input: {
  stageId: string;
  concept: string;
  answer: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "unavailable" as const };
  if (!(await aiAllowed(session.user.id))) return { ok: false as const, error: "unavailable" as const };
  return reviewConceptStep({ ...input, userId: session.user.id });
}

/** Records the stage from the ideas the server already accepted. The browser sends only which stage. */
export async function completeExplainWizard(input: { stageId: string }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "unavailable" as const };
  return finishExplainWizard({ stageId: String(input.stageId), userId: session.user.id });
}
