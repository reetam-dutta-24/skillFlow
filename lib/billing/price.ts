/** Words for a Stripe price. The upgrade page uses this so the label does not depend on a `$` in the env file. */
export function formatStripePrice(input: {
  unit_amount: number | null;
  currency: string;
  recurring?: { interval: string; interval_count?: number } | null;
}) {
  if (input.unit_amount == null) return null;
  const amount = new Intl.NumberFormat("en", {
    style: "currency",
    currency: input.currency.toUpperCase(),
  }).format(input.unit_amount / 100);
  const recurring = input.recurring;
  if (!recurring?.interval) return amount;
  const count = recurring.interval_count ?? 1;
  if (count === 1) return `${amount}/${recurring.interval}`;
  return `${amount} every ${count} ${recurring.interval}s`;
}
