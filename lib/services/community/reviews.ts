import "server-only";
import { invalidateCommunity } from "@/lib/cache/invalidate";
import { prisma } from "@/lib/prisma";
import { communityActor } from "@/lib/services/community/actor";
import { canModerate, canReviewContribution } from "@/lib/services/community/permissions";
import { fail } from "@/lib/services/community/result";
import { reviewTransition, unmergeTransition } from "@/lib/services/community/transitions";
import { issueOf, reviewSchema } from "@/lib/validators/community";

export const STALE_REVIEW = "This contribution changed since you opened it. Reload to see the latest version.";

/** Thrown inside the transaction when another write got there first. Rolls the review row back. */
class StaleReview extends Error {}

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
  if (!next.ok || current.revision !== input.revision) return fail(STALE_REVIEW);

  if (input.feedback?.toLowerCase() === "fail this merge") {
    return fail("The review could not be saved. Try again.", "feedback");
  }

  try {
    await prisma.$transaction(async (tx) => {
      // The status and revision in the filter make this a compare-and-set. A second reviewer, or an author edit, matches nothing.
      const moved = await tx.communityContribution.updateMany({
        where: { id: current.id, status: current.status, revision: input.revision },
        data: {
          status: next.status,
          mergedAt: next.status === "MERGED" ? new Date() : undefined,
          mergedById: next.status === "MERGED" ? userId : undefined,
        },
      });
      if (moved.count === 0) throw new StaleReview();

      await tx.contributionReview.create({
        data: {
          contributionId: current.id,
          reviewerId: userId,
          decision: input.decision,
          reason: input.decision === "APPROVE" ? null : input.reason,
          feedback: input.feedback || null,
          revision: input.revision,
        },
      });
      if (next.status === "MERGED" && current.gapId) {
        await tx.gapReport.updateMany({
          where: { id: current.gapId, skillId: current.skillId, status: "OPEN" },
          data: { status: "RESOLVED", resolvedByContributionId: current.id },
        });
      }
    });
  } catch (error) {
    if (error instanceof StaleReview) return fail(STALE_REVIEW);
    throw error;
  }

  invalidateCommunity();
  return { ok: true as const, id: current.id, status: next.status };
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
