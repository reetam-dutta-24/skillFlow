import { describe, expect, it } from "vitest";
import { nicheCardHref } from "@/lib/billing/niche-link";

const premiumNiche = {
  status: "available" as const,
  offer: "MONETIZED" as const,
  href: null,
  slug: "story-writing",
};

describe("niche card link", () => {
  it("sends a free account to the upgrade page", () => {
    expect(nicheCardHref({ ...premiumNiche, premium: false })).toBe("/upgrade");
  });

  it("lets a subscriber open the roadmap", () => {
    expect(nicheCardHref({ ...premiumNiche, premium: true })).toBe("/roadmap/story-writing");
  });

  it("keeps a free path on its roadmap", () => {
    expect(
      nicheCardHref({
        status: "available",
        offer: "FREE",
        href: "/roadmap/photography",
        slug: "photography",
        premium: false,
      }),
    ).toBe("/roadmap/photography");
  });

  it("leaves a coming-soon niche and a peek card unlinked", () => {
    expect(nicheCardHref({ ...premiumNiche, status: "coming_soon", premium: false })).toBeNull();
    expect(nicheCardHref({ ...premiumNiche, preview: true, premium: false })).toBeNull();
  });
});
