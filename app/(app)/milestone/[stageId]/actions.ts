"use server";

import { auth } from "@/lib/auth";
import { reviewMilestone } from "@/lib/data/milestone";
import { finishExplainWizard, reviewConceptStep } from "@/lib/explain/review";
import type { WizardStep } from "@/lib/explain/wizard";
import type { ExplainReview } from "@/lib/types/pages";

export async function reviewExplanation(input: {
  stageId: string;
  answer: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
}): Promise<ExplainReview> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unavailable" };
  return reviewMilestone({ ...input, userId: session.user.id });
}

export async function reviewConcept(input: {
  stageId: string;
  concept: string;
  answer: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "unavailable" as const };
  return reviewConceptStep(input);
}

export async function completeExplainWizard(input: { stageId: string; steps: WizardStep[] }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "unavailable" as const };
  return finishExplainWizard({ ...input, userId: session.user.id });
}
