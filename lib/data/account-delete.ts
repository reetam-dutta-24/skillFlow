import "server-only";
import bcrypt from "bcryptjs";
import { getStripe } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";
import { removeUploadedFile } from "@/lib/uploads";

/** What the learner types to confirm. */
export const DELETE_PHRASE = "DELETE";

const BILLED = new Set(["ACTIVE", "TRIALING", "PAST_DUE", "INCOMPLETE", "UNPAID"]);

export type DeleteAccountResult =
  | { ok: true; touched: { community: boolean; map: boolean; liveVideo: boolean; events: boolean } }
  | { ok: false; error: string };

/**
 * Permanently delete one account and everything it created, as the Privacy Policy promises: Open Source
 * contributions (and the questions on them), community events, and requests are removed with it. Only moderation
 * decisions this person made on other people's posts stay, without a name. Stage completions have no foreign key to
 * User, and the schema would only unlink contributions, events, and requests, so those are removed here by hand.
 */
export async function deleteAccountRecord(
  userId: string,
  input: { confirm: string; password: string },
): Promise<DeleteAccountResult> {
  if (input.confirm.trim() !== DELETE_PHRASE) return { ok: false, error: `Type ${DELETE_PHRASE} to confirm.` };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      image: true,
      password: true,
      subscription: { select: { stripeSubscriptionId: true, status: true } },
      learnerProfile: { select: { showOnMap: true } },
      creatorWorks: { select: { status: true, mediaUrl: true } },
      communityContributions: { select: { imageUrl: true } },
      _count: { select: { communityContributions: true, communityMemberships: true, contributionQuestions: true, gapReports: true, submittedEvents: true } },
    },
  });
  if (!user) return { ok: false, error: "This account no longer exists. Sign in again." };

  if (user.password) {
    const valid = input.password ? await bcrypt.compare(input.password, user.password) : false;
    if (!valid) return { ok: false, error: "That password is not right." };
  }

  if (user.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return { ok: false, error: "This is the only admin account. Make someone else an admin first." };
  }

  // Stop the charge before the record that links this person to Stripe is gone.
  const subscription = user.subscription;
  if (subscription?.stripeSubscriptionId && BILLED.has(subscription.status)) {
    const stripe = getStripe();
    if (!stripe) return { ok: false, error: "Premium is still active and billing cannot be reached. Cancel it from the plan page first." };
    try {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } catch {
      return { ok: false, error: "Premium could not be cancelled just now. Try again, or cancel it from the plan page first." };
    }
  }

  await prisma.$transaction([
    prisma.stageCompletion.deleteMany({ where: { userId } }),
    prisma.communityContribution.deleteMany({ where: { authorId: userId } }),
    prisma.event.deleteMany({ where: { submittedById: userId, source: "COMMUNITY" } }),
    prisma.gapReport.deleteMany({ where: { authorId: userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  // Files on disk are not in the database. A failure here leaves an orphaned file, never a half-deleted account.
  const files = [user.image, ...user.creatorWorks.map((work) => work.mediaUrl), ...user.communityContributions.map((post) => post.imageUrl)].filter(
    (file): file is string => typeof file === "string" && file.startsWith("/uploads/"),
  );
  await Promise.all(files.map((file) => removeUploadedFile(file)));

  return {
    ok: true,
    touched: {
      community:
        user._count.communityContributions + user._count.communityMemberships + user._count.contributionQuestions + user._count.gapReports > 0,
      map: Boolean(user.learnerProfile?.showOnMap),
      liveVideo: user.creatorWorks.some((work) => work.status === "LIVE"),
      events: user._count.submittedEvents > 0,
    },
  };
}
