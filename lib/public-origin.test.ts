import { describe, expect, it } from "vitest";
import { publicOrigin } from "@/lib/public-origin";

const INTERNAL = "http://localhost:3000/auth/continue";

describe("publicOrigin", () => {
  it("prefers AUTH_URL, so a proxied request never redirects to localhost", () => {
    const headers = new Headers({ host: "localhost:3000" });
    expect(publicOrigin(headers, INTERNAL, "https://app.example.com")).toBe("https://app.example.com");
  });

  it("drops any path on AUTH_URL", () => {
    expect(publicOrigin(new Headers(), INTERNAL, "https://app.example.com/some/path")).toBe("https://app.example.com");
  });

  it("uses the forwarded host and protocol when AUTH_URL is not set", () => {
    const headers = new Headers({ "x-forwarded-host": "app.example.com", "x-forwarded-proto": "https", host: "localhost:3000" });
    expect(publicOrigin(headers, INTERNAL, undefined)).toBe("https://app.example.com");
  });

  it("falls back to the Host header in local development", () => {
    const headers = new Headers({ host: "localhost:3000" });
    expect(publicOrigin(headers, INTERNAL, undefined)).toBe("http://localhost:3000");
  });

  it("falls back to the request URL when there are no headers", () => {
    expect(publicOrigin(new Headers(), INTERNAL, undefined)).toBe("http://localhost:3000");
  });

  it("ignores a malformed AUTH_URL instead of throwing", () => {
    const headers = new Headers({ host: "localhost:3000" });
    expect(publicOrigin(headers, INTERNAL, "not a url")).toBe("http://localhost:3000");
  });
});
