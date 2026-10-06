import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";

/** Opens Stripe's customer portal so a subscriber can change or cancel the plan. */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in again before managing the plan." }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });

  const row = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });
  if (!row) return NextResponse.json({ error: "This account has no Stripe subscription yet." }, { status: 404 });

  const origin = new URL(request.url).origin;
  const portal = await stripe.billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${origin}/upgrade`,
  });
  return NextResponse.json({ url: portal.url });
}
