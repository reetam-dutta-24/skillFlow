"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { reindexResource } from "@/lib/assistant/store";
import { invalidateCatalog } from "@/lib/cache/invalidate";
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
    if (input.decision === "approve") invalidateCatalog();
    // The assistant's index picks up the new resource after the response; a failure is logged, never shown here.
    const resourceId = "resourceId" in result ? result.resourceId : undefined;
    if (resourceId) after(() => reindexResource(resourceId));
  }
  return result;
}
