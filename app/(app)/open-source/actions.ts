"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { nextReviewId } from "@/lib/data/community-review";
import { saveUploadedFile } from "@/lib/uploads";
import { createContribution } from "@/lib/services/community/contributions";
import { joinCommunity, leaveCommunity } from "@/lib/services/community/memberships";
import { reviewContribution } from "@/lib/services/community/reviews";
import { toggleUseful } from "@/lib/services/community/useful";

async function signedInId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export type ContributeState = { ok: false; error: string; field?: string } | null;
export type ReviewState = { ok: false; error: string; field?: string } | null;

const DONE_BY_STATUS = { MERGED: "merged", CHANGES_REQUESTED: "changes", CLOSED: "closed", OPEN: "" } as const;

export async function joinCommunityAction(formData: FormData) {
  const userId = await signedInId();
  const skillId = String(formData.get("skillId") ?? "");
  if (!userId || !skillId) return;
  await joinCommunity(userId, skillId);
}

export async function leaveCommunityAction(formData: FormData) {
  const userId = await signedInId();
  const skillId = String(formData.get("skillId") ?? "");
  if (!userId || !skillId) return;
  await leaveCommunity(userId, skillId);
}

export async function toggleUsefulAction(contributionId: string) {
  const userId = await signedInId();
  if (!userId) return { ok: false as const, error: "Sign in to continue." };
  return toggleUseful(userId, contributionId);
}

export async function createContributionAction(_prev: ContributeState, formData: FormData): Promise<ContributeState> {
  const userId = await signedInId();
  if (!userId) return { ok: false, error: "Sign in to continue." };

  const slug = String(formData.get("slug") ?? "");
  const file = formData.get("imageFile");
  let imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedFile(file, "image");
    if (!saved.ok) return { ok: false, error: saved.error, field: "imageUrl" };
    imageUrl = saved.url;
  }

  const type = String(formData.get("type") ?? "");
  const titles = formData.getAll("stepTitle").map((value) => String(value));
  const urls = formData.getAll("stepUrl").map((value) => String(value));
  const notes = formData.getAll("stepNote").map((value) => String(value));
  const steps =
    type === "LEARNING_PATH"
      ? titles
          .map((title, index) => ({
            title: title.trim(),
            url: urls[index]?.trim() || undefined,
            note: notes[index]?.trim() || undefined,
          }))
          .filter((step) => step.title || step.url || step.note)
      : undefined;

  const stageId = String(formData.get("stageId") ?? "").trim();
  const result = await createContribution(userId, {
    skillId: String(formData.get("skillId") ?? ""),
    type,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    imageUrl: imageUrl || undefined,
    sources: String(formData.get("sources") ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
    stageId: stageId || undefined,
    disclosure: String(formData.get("disclosure") ?? ""),
    steps,
  });
  if (!result.ok) return { ok: false, error: result.error, field: result.field };
  redirect(`/open-source/${slug}/c/${result.id}`);
}

/** One review decision. The service checks the role, the author, and the revision again. */
export async function reviewContributionAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const userId = await signedInId();
  if (!userId) return { ok: false, error: "Sign in to continue." };

  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();
  const result = await reviewContribution(userId, {
    contributionId: String(formData.get("contributionId") ?? ""),
    decision,
    reason: decision === "APPROVE" || !reason ? undefined : reason,
    feedback: feedback || undefined,
    revision: String(formData.get("revision") ?? ""),
  });
  if (!result.ok) return { ok: false, error: result.error, field: result.field };

  const done = DONE_BY_STATUS[result.status];
  const next = await nextReviewId(userId);
  redirect(next ? `/open-source/review/${next}?done=${done}` : `/open-source/review?done=${done}`);
}
