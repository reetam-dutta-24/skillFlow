"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { reviewSubmissionRecord } from "@/lib/data/admin";

export async function reviewSubmission(input: { id: string; decision: "approve" | "reject"; notes: string }) {
  const session = await requireAdmin();
  const result = await reviewSubmissionRecord({
    id: input.id,
    reviewerId: session.user.id,
    decision: input.decision,
    notes: input.notes,
  });
  if (result.ok) {
    revalidatePath("/admin/submissions");
    revalidatePath("/submit");
    revalidatePath("/roadmap");
    revalidatePath(result.roadmapHref);
    revalidatePath(result.lessonHref);
  }
  return result;
}
