import { describe, expect, it } from "vitest";
import { canUseLiveSearch } from "@/lib/events/access";
import { serpApiMonthlyCap } from "@/lib/events/config";
import { canSubmitAnother, serpApiAllows, ticketmasterAllows } from "@/lib/events/quota";

describe("usage caps", () => {
  it("allows a Ticketmaster call until the daily free limit", () => {
    expect(ticketmasterAllows(4999)).toBe(true);
    expect(ticketmasterAllows(5000)).toBe(false);
  });

  it("keeps SerpApi at 200 even when a higher number is configured", () => {
    expect(serpApiMonthlyCap("999")).toBe(200);
    expect(serpApiMonthlyCap("40")).toBe(40);
    expect(serpApiAllows(199, "999")).toBe(true);
    expect(serpApiAllows(200, "999")).toBe(false);
  });

  it("lets a learner submit three community events a day", () => {
    expect(canSubmitAnother(2)).toBe(true);
    expect(canSubmitAnother(3)).toBe(false);
  });
});

describe("canUseLiveSearch", () => {
  it("is on for Premium and for an admin", () => {
    expect(canUseLiveSearch({ role: "ADMIN", premium: false })).toBe(true);
    expect(canUseLiveSearch({ role: "USER", premium: true })).toBe(true);
    expect(canUseLiveSearch({ role: "USER", premium: false })).toBe(false);
    expect(canUseLiveSearch({ premium: false })).toBe(false);
  });
});
