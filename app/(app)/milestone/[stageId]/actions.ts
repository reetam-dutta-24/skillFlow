"use server";

import { reviewMilestone } from "@/lib/data/milestone";
import type { ExplainReview } from "@/lib/types/pages";

export async function reviewExplanation(input: {
  stageId: string;
  answer: string;
  followUpAnswer?: string;
}): Promise<ExplainReview> {
  return reviewMilestone(input);
}
