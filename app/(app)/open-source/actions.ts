"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { nextReviewId } from "@/lib/data/community-review";
import { saveUploadedFile } from "@/lib/uploads";
import { createContribution, updateContribution, withdrawContribution } from "@/lib/services/community/contributions";
import { moderateGap, reportGap } from "@/lib/services/community/gaps";
import { joinCommunity, leaveCommunity } from "@/lib/services/community/memberships";
import { reviewContribution, unmergeContribution } from "@/lib/services/community/reviews";
import { grantRole, revokeRole } from "@/lib/services/community/roles";
import { toggleUseful } from "@/lib/services/community/useful";

async function signedInId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** One failure shape for every form here. Success redirects. */
export type FormState = { ok: false; error: string; field?: string } | null;
export type ContributeState = FormState;
export type ReviewState = FormState;

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

/** Reads the contribute form. The same fields for a new contribution and an edit. */
async function contributionFields(formData: FormData) {
  const file = formData.get("imageFile");
  let imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedFile(file, "image");
    if (!saved.ok) return { ok: false as const, error: saved.error, field: "imageUrl" };
    imageUrl = saved.url;
  } else if (!imageUrl && formData.get("removeImage") !== "on") {
    // An edit keeps an uploaded image unless the author removes it.
    imageUrl = String(formData.get("currentImageUrl") ?? "").trim();
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
  const gapId = String(formData.get("gapId") ?? "").trim();
  return {
    ok: true as const,
    input: {
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
      gapId: gapId || undefined,
      disclosure: String(formData.get("disclosure") ?? ""),
      steps,
    },
  };
}

export async function createContributionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await signedInId();
  if (!userId) return { ok: false, error: "Sign in to continue." };

  const fields = await contributionFields(formData);
  if (!fields.ok) return fields;
  const result = await createContribution(userId, fields.input);
  if (!result.ok) return { ok: false, error: result.error, field: result.field };
  redirect(`/open-source/me/${result.id}?saved=created`);
}

/** The author edits. A merged contribution becomes a resubmission and leaves the public lists. */
export async function updateContributionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await signedInId();
  if (!userId) return { ok: false, error: "Sign in to continue." };

  const contributionId = String(formData.get("contributionId") ?? "");
  const fields = await contributionFields(formData);
  if (!fields.ok) return fields;
  const result = await updateContribution(userId, contributionId, fields.input);
  if (!result.ok) return { ok: false, error: result.error, field: result.field };
  redirect(`/open-source/me/${result.id}?saved=${result.resubmitted ? "resubmitted" : "edited"}`);
}

export async function withdrawContributionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await signedInId();
  if (!userId) return { ok: false, error: "Sign in to continue." };
  const result = await withdrawContribution(userId, String(formData.get("contributionId") ?? ""));
  if (!result.ok) return { ok: false, error: result.error };
  redirect(`/open-source/me/${result.id}?saved=withdrawn`);
}

/** One review decision. The service checks the role, the author, and the revision again. */
export async function reviewContributionAction(_prev: FormState, formData: FormData): Promise<FormState> {
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

/** Maintainers and admins hide a merged contribution. */
export async function unmergeContributionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await signedInId();
  if (!userId) return { ok: false, error: "Sign in to continue." };
  const reason = String(formData.get("reason") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();
  const result = await unmergeContribution(userId, {
    contributionId: String(formData.get("contributionId") ?? ""),
    reason: reason || undefined,
    feedback: feedback || undefined,
  });
  if (!result.ok) return { ok: false, error: result.error, field: result.field };
  redirect(`/open-source/${result.slug}/c/${result.id}?done=unmerged`);
}

/** Grant or revoke a reviewer or maintainer role. The service applies the rules. */
export async function changeRoleAction(input: { op: "grant" | "revoke"; userId: string; skillId: string; role: string }) {
  const userId = await signedInId();
  if (!userId) return { ok: false as const, error: "Sign in to continue." };
  const data = { userId: input.userId, skillId: input.skillId, role: input.role };
  return input.op === "grant" ? grantRole(userId, data) : revokeRole(userId, data);
}

export async function reportGapAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await signedInId();
  if (!userId) return { ok: false, error: "Sign in to continue." };
  const stageId = String(formData.get("stageId") ?? "").trim();
  const result = await reportGap(userId, {
    skillId: String(formData.get("skillId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    stageId: stageId || undefined,
  });
  if (!result.ok) return { ok: false, error: result.error, field: result.field };
  const slug = encodeURIComponent(String(formData.get("slug") ?? ""));
  redirect(`/open-source/${slug}?tab=gaps&done=gap`);
}

export async function askPostQuestionAction(contributionId: string, body: string) {
  const userId = await signedInId();
  if (!userId) return { ok: false as const, error: "Sign in to continue." };
  const { askPostQuestion } = await import("@/lib/services/community/questions");
  return askPostQuestion(userId, contributionId, body);
}

export async function answerPostQuestionAction(questionId: string, answer: string) {
  const userId = await signedInId();
  if (!userId) return { ok: false as const, error: "Sign in to continue." };
  const { answerPostQuestion } = await import("@/lib/services/community/questions");
  return answerPostQuestion(userId, questionId, answer);
}

/** Good-first label, close, or reopen. Maintainers and admins only, checked in the service. */
export async function moderateGapAction(input: { gapId: string; op: string }) {
  const userId = await signedInId();
  if (!userId) return { ok: false as const, error: "Sign in to continue." };
  return moderateGap(userId, input);
}
