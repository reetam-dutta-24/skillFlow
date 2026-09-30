import { describe, expect, it } from "vitest";
import { normalizeCommunityUrl } from "@/lib/links/normalize-url";

describe("normalizeCommunityUrl", () => {
  it("lowercases the host, drops the fragment, tracking params, and a trailing slash", () => {
    const value = normalizeCommunityUrl("HTTPS://Example.COM/docs/?utm_source=x&b=2&fbclid=abc&a=1#part/");
    expect(value).toBe("https://example.com/docs?a=1&b=2");
  });

  it("rejects http, a user, and a port other than 443", () => {
    expect(normalizeCommunityUrl("http://example.com/a")).toBeNull();
    expect(normalizeCommunityUrl("https://user:pass@example.com/a")).toBeNull();
    expect(normalizeCommunityUrl("https://example.com:8443/a")).toBeNull();
  });

  it("keeps a bare origin", () => {
    expect(normalizeCommunityUrl("https://example.com")).toBe("https://example.com/");
  });
});
