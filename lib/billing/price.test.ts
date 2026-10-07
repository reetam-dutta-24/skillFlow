import { describe, expect, it } from "vitest";
import { formatStripePrice } from "@/lib/billing/price";

describe("stripe price label", () => {
  it("formats a monthly amount", () => {
    expect(formatStripePrice({ unit_amount: 500, currency: "usd", recurring: { interval: "month" } })).toBe("$5.00/month");
  });

  it("returns nothing when Stripe has no amount", () => {
    expect(formatStripePrice({ unit_amount: null, currency: "usd" })).toBeNull();
  });
});
