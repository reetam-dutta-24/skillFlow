"use server";

import { auth } from "@/lib/auth";
import { reviewMilestone } from "@/lib/data/milestone";
import type { ExplainReview } from "@/lib/types/pages";

export async function reviewExplanation(input: {
  stageId: string;
  answer: string;
  followUpAnswer?: string;
}): Promise<ExplainReview> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unavailable" };
  return reviewMilestone({ ...input, userId: session.user.id });
}
