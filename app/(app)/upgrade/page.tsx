import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { viewerHasPremium } from "@/lib/billing/access";
import { billingConfig } from "@/lib/billing/config";
import { formatStripePrice } from "@/lib/billing/price";
import { getStripe } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";
import { UpgradePanel } from "./_components/UpgradePanel";

export const metadata: Metadata = { title: "Upgrade" };

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { checkout } = await searchParams;
  const { priceId, priceLabel: fallbackLabel, configured } = billingConfig();
  const stripe = getStripe();
  let priceLabel = fallbackLabel;
  if (stripe && priceId) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      priceLabel = formatStripePrice(price) ?? fallbackLabel;
    } catch {
      priceLabel = fallbackLabel;
    }
  }
  const premium = await viewerHasPremium();
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  });
  const notice =
    checkout === "success"
      ? "Checkout finished. Premium opens when Stripe confirms the subscription."
      : checkout === "cancel"
        ? "Checkout was canceled. Nothing was charged."
        : "";

  return (
    <div className="sf-v2">
      <header className="sf-page-head">
        <h1>Upgrade</h1>
        <p>
          {premium
            ? "This account includes Premium."
            : "Premium opens the niches outside the thirty free paths, and lets you appear on the learner map."}
        </p>
      </header>
      <UpgradePanel
        priceLabel={priceLabel}
        premium={premium}
        canManage={Boolean(subscription?.stripeCustomerId)}
        configured={configured}
        notice={notice}
      />
    </div>
  );
}
