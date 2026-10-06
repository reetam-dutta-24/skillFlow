import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { billingConfig } from "@/lib/billing/config";
import { getStripe } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";

/** Starts Stripe Checkout. The card form stays on Stripe. */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in again before upgrading." }, { status: 401 });

  const stripe = getStripe();
  const { priceId, publishableKey, configured } = billingConfig();
  if (!stripe || !configured) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const existing = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });
  const email = session.user.email ?? undefined;

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/upgrade?checkout=success`,
    cancel_url: `${origin}/upgrade?checkout=cancel`,
    client_reference_id: userId,
    customer: existing?.stripeCustomerId,
    customer_email: existing?.stripeCustomerId ? undefined : email,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });

  if (!checkout.url) return NextResponse.json({ error: "Checkout could not be opened." }, { status: 502 });
  return NextResponse.json({ url: checkout.url, publishableKey });
}
