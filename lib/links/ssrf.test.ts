import { describe, expect, it } from "vitest";
import { isBlockedAddress, isMetadataHost } from "@/lib/links/ssrf";

describe("isBlockedAddress", () => {
  it("blocks loopback, private, link-local, and metadata addresses", () => {
    expect(isBlockedAddress("127.0.0.1")).toBe(true);
    expect(isBlockedAddress("10.1.2.3")).toBe(true);
    expect(isBlockedAddress("192.168.1.9")).toBe(true);
    expect(isBlockedAddress("172.16.0.4")).toBe(true);
    expect(isBlockedAddress("169.254.169.254")).toBe(true);
    expect(isBlockedAddress("::1")).toBe(true);
    expect(isBlockedAddress("fe80::1")).toBe(true);
    expect(isBlockedAddress("fc00::1")).toBe(true);
    expect(isBlockedAddress("::ffff:127.0.0.1")).toBe(true);
  });

  it("allows a public address", () => {
    expect(isBlockedAddress("8.8.8.8")).toBe(false);
    expect(isBlockedAddress("2001:4860:4860::8888")).toBe(false);
  });

  it("recognizes cloud metadata hostnames", () => {
    expect(isMetadataHost("metadata.google.internal")).toBe(true);
    expect(isMetadataHost("example.com")).toBe(false);
  });
});
