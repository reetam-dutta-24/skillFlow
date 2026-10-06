import "server-only";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { billingGrantsPremium } from "@/lib/billing/status";

/** This signed-in person can open Premium niches and appear on the learner map. Admins can, so the product can be checked without a charge. */
export async function viewerHasPremium() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return false;
  if (session.user.role === "ADMIN") return true;
  return userHasPremium(userId);
}

export async function userHasPremium(userId: string) {
  const row = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true },
  });
  return billingGrantsPremium(row?.status, row?.currentPeriodEnd ?? null);
}
