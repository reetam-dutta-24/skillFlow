import "server-only";
import { invalidateCommunity } from "@/lib/cache/invalidate";
import { prisma } from "@/lib/prisma";
import { communityActor } from "@/lib/services/community/actor";
import { canModerate, canReviewContribution } from "@/lib/services/community/permissions";
import { fail } from "@/lib/services/community/result";
import { reviewTransition, unmergeTransition } from "@/lib/services/community/transitions";
import { issueOf, reviewSchema } from "@/lib/validators/community";

export async function reviewContribution(userId: string, raw: unknown) {
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return fail(issueOf(parsed.error).error, issueOf(parsed.error).field);
  const input = parsed.data;

  const actor = await communityActor(userId);
  if (!actor) return fail("Sign in to continue.");

  const current = await prisma.communityContribution.findUnique({
    where: { id: input.contributionId },
    select: { id: true, skillId: true, authorId: true, status: true, revision: true, gapId: true },
  });
  if (!current) return fail("That contribution is not here.");
  if (!canReviewContribution(actor, current.skillId, current.authorId)) return fail("You cannot review this contribution.");

  const next = reviewTransition(current.status, input.decision);
  if (!next.ok) return fail(next.error);

  await prisma.$transaction(async (tx) => {
    await tx.contributionReview.create({
      data: {
        contributionId: current.id,
        reviewerId: userId,
        decision: input.decision,
        reason: input.decision === "APPROVE" ? null : input.reason,
        feedback: input.feedback?.trim() || null,
        revision: current.revision,
      },
    });
    await tx.communityContribution.update({
      where: { id: current.id },
      data: {
        status: next.status,
        mergedAt: next.status === "MERGED" ? new Date() : undefined,
        mergedById: next.status === "MERGED" ? userId : undefined,
      },
    });
    if (next.status === "MERGED" && current.gapId) {
      await tx.gapReport.updateMany({
        where: { id: current.gapId, skillId: current.skillId, status: "OPEN" },
        data: { status: "RESOLVED", resolvedByContributionId: current.id },
      });
    }
  });

  invalidateCommunity();
  return { ok: true as const, status: next.status };
}

export async function unmergeContribution(userId: string, contributionId: string, reason: string) {
  const actor = await communityActor(userId);
  if (!actor) return fail("Sign in to continue.");
  const current = await prisma.communityContribution.findUnique({
    where: { id: contributionId },
    select: { id: true, skillId: true, status: true, revision: true },
  });
  if (!current) return fail("That contribution is not here.");
  if (!canModerate(actor, current.skillId)) return fail("You cannot unmerge this contribution.");
  const next = unmergeTransition(current.status);
  if (!next.ok) return fail(next.error);
  const note = reason.trim();
  if (!note) return fail("Add a reason.", "reason");
  if (note.length > 500) return fail("Keep the note to 500 characters.", "feedback");

  await prisma.$transaction(async (tx) => {
    await tx.contributionReview.create({
      data: {
        contributionId: current.id,
        reviewerId: userId,
        decision: "CLOSE",
        reason: "OTHER",
        feedback: note,
        revision: current.revision,
      },
    });
    await tx.communityContribution.update({ where: { id: current.id }, data: { status: next.status } });
  });
  invalidateCommunity();
  return { ok: true as const, status: next.status };
}
