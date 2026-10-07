import "server-only";
import { cacheLife } from "next/cache";
import { formatStripePrice } from "@/lib/billing/price";
import { getStripe } from "@/lib/billing/stripe";

/**
 * The subscription price in words. The same label for every visitor.
 * A failed Stripe read throws, so a short outage is not stored.
 */
export async function loadStripePriceLabel(priceId: string): Promise<string | null> {
  "use cache";
  cacheLife("hours");
  const stripe = getStripe();
  if (!stripe) return null;
  const price = await stripe.prices.retrieve(priceId);
  return formatStripePrice(price);
}
