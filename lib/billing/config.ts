/** Names only. The secret key never leaves the server. */
export function billingConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const priceId = process.env.STRIPE_PRICE_ID?.trim() ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const priceLabel = process.env.STRIPE_PRICE_LABEL?.trim() || "Shown at checkout";
  return {
    secretKey,
    priceId,
    publishableKey,
    webhookSecret,
    priceLabel,
    configured: Boolean(secretKey && priceId && publishableKey),
  };
}
