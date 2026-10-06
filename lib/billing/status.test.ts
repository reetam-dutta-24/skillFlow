import { describe, expect, it } from "vitest";
import { billingGrantsPremium, billingStatusFromStripe } from "@/lib/billing/status";

const now = new Date("2026-10-07T00:00:00.000Z");

describe("premium subscription", () => {
  it("counts an active or trialing subscription that has not ended", () => {
    expect(billingGrantsPremium("ACTIVE", null, now)).toBe(true);
    expect(billingGrantsPremium("TRIALING", new Date("2026-11-01T00:00:00.000Z"), now)).toBe(true);
    expect(billingGrantsPremium("ACTIVE", new Date("2026-09-01T00:00:00.000Z"), now)).toBe(false);
    expect(billingGrantsPremium("CANCELED", null, now)).toBe(false);
    expect(billingGrantsPremium("PAST_DUE", null, now)).toBe(false);
    expect(billingGrantsPremium(null, null, now)).toBe(false);
  });

  it("maps Stripe statuses onto the stored set", () => {
    expect(billingStatusFromStripe("active")).toBe("ACTIVE");
    expect(billingStatusFromStripe("trialing")).toBe("TRIALING");
    expect(billingStatusFromStripe("incomplete_expired")).toBe("CANCELED");
    expect(billingStatusFromStripe("paused")).toBe("INCOMPLETE");
  });
});
