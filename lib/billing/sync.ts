import "server-only";
import type Stripe from "stripe";
import { invalidateMap } from "@/lib/cache/invalidate";
import { prisma } from "@/lib/prisma";
import { billingGrantsPremium, billingStatusFromStripe } from "@/lib/billing/status";

function periodEnd(subscription: Stripe.Subscription) {
  const stamp = subscription.items?.data?.[0]?.current_period_end ?? 0;
  if (!stamp) return null;
  return new Date(stamp * 1000);
}

export async function saveSubscription(input: {
  userId: string;
  customerId: string;
  subscriptionId: string | null;
  status: string;
  priceId: string | null;
  periodEnd: Date | null;
}) {
  const status = billingStatusFromStripe(input.status);
  await prisma.subscription.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      stripeCustomerId: input.customerId,
      stripeSubscriptionId: input.subscriptionId,
      status,
      priceId: input.priceId,
      currentPeriodEnd: input.periodEnd,
    },
    update: {
      stripeCustomerId: input.customerId,
      stripeSubscriptionId: input.subscriptionId,
      status,
      priceId: input.priceId,
      currentPeriodEnd: input.periodEnd,
    },
  });
  if (!billingGrantsPremium(status, input.periodEnd)) {
    await prisma.learnerProfile.updateMany({
      where: { userId: input.userId },
      data: { showOnMap: false },
    });
  }
  invalidateMap();
}

export async function saveStripeSubscription(userId: string, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  await saveSubscription({
    userId,
    customerId,
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId,
    periodEnd: periodEnd(subscription),
  });
}

export async function userIdForCustomer(customerId: string) {
  const row = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    select: { userId: true },
  });
  return row?.userId ?? null;
}
