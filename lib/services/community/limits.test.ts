import { describe, expect, it } from "vitest";
import { COMMUNITY_LIMITS, limitMessage, limitReached } from "@/lib/services/community/limits";

describe("community rate limits", () => {
  it("stops at the cap and allows the count below it", () => {
    expect(limitReached(4, COMMUNITY_LIMITS.contributionsPerDay)).toBe(false);
    expect(limitReached(5, COMMUNITY_LIMITS.contributionsPerDay)).toBe(true);
    expect(limitReached(3, COMMUNITY_LIMITS.gapsPerDay)).toBe(true);
    expect(limitReached(60, COMMUNITY_LIMITS.usefulTogglesPerHour)).toBe(true);
    expect(limitReached(59, COMMUNITY_LIMITS.usefulTogglesPerHour)).toBe(false);
  });

  it("names the limit in the message", () => {
    expect(limitMessage("contributions")).toContain("5");
    expect(limitMessage("gaps")).toContain("3");
    expect(limitMessage("useful")).toContain("60");
  });
});
