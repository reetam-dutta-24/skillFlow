import { describe, expect, it } from "vitest";
import { FREE_PATH_SLUGS } from "@/lib/niches/tiers";
import { keywordsFor } from "@/lib/events/keywords";

describe("event keywords", () => {
  it("gives every free path its own search words", () => {
    for (const slug of FREE_PATH_SLUGS) {
      const words = keywordsFor(slug, "Niche name");
      expect(words.length).toBeGreaterThan(0);
      expect(words).not.toEqual(["Niche name"]);
    }
  });

  it("uses the niche name outside the free paths", () => {
    expect(keywordsFor("story-writing", "Story Writing")).toEqual(["Story Writing"]);
  });
});
