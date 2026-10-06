/** Active and trialing subscriptions open Premium. A period that has already ended does not. */
export function billingGrantsPremium(
  status: string | null | undefined,
  periodEnd: Date | null,
  now = new Date(),
) {
  if (status !== "ACTIVE" && status !== "TRIALING") return false;
  if (periodEnd && periodEnd.getTime() <= now.getTime()) return false;
  return true;
}

const KNOWN = new Set(["INCOMPLETE", "ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "UNPAID"]);

export function billingStatusFromStripe(status: string) {
  const normalized = status.toUpperCase().replace("-", "_");
  if (normalized === "INCOMPLETE_EXPIRED") return "CANCELED" as const;
  if (KNOWN.has(normalized)) return normalized as "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "UNPAID" | "INCOMPLETE";
  return "INCOMPLETE" as const;
}
