import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { billingConfig } from "@/lib/billing/config";
import { getStripe } from "@/lib/billing/stripe";
import { saveStripeSubscription, userIdForCustomer } from "@/lib/billing/sync";

async function userIdFromSubscription(subscription: Stripe.Subscription) {
  const fromMetadata = subscription.metadata?.userId;
  if (fromMetadata) return fromMetadata;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  return userIdForCustomer(customerId);
}

/** Stripe calls this with the raw body. The signature must match before any write. */
export async function POST(request: Request) {
  const stripe = getStripe();
  const { webhookSecret } = billingConfig();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkout = event.data.object;
    const userId = checkout.metadata?.userId || checkout.client_reference_id;
    const subscriptionId = typeof checkout.subscription === "string" ? checkout.subscription : checkout.subscription?.id;
    if (userId && subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await saveStripeSubscription(userId, subscription);
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object;
    const userId = await userIdFromSubscription(subscription);
    if (userId) await saveStripeSubscription(userId, subscription);
  }

  return NextResponse.json({ received: true });
}
