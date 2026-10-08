import { describe, expect, it } from "vitest";
import { AVATAR_STYLES, avatarSvg, isAvatarChoice } from "@/lib/avatar";
import { displayNameProblem, isPhotoChoice, suggestedDisplayName } from "@/lib/profile-identity";

describe("display name", () => {
  it("accepts a plain name and rejects empty, short, long, and email-like ones", () => {
    expect(displayNameProblem("Riya Sharma")).toBeNull();
    expect(displayNameProblem("  ")).toBe("Enter a display name.");
    expect(displayNameProblem("R")).toBe("Use at least 2 characters.");
    expect(displayNameProblem("x".repeat(51))).toMatch(/under 50/);
    expect(displayNameProblem("someone@example.com")).toBe("Use a name, not an email address.");
  });

  it("offers an empty name when the stored one is really the email", () => {
    expect(suggestedDisplayName("rdutta_be23", "rdutta_be23@thapar.edu")).toBe("");
    expect(suggestedDisplayName("rdutta_be23@thapar.edu", "rdutta_be23@thapar.edu")).toBe("");
    expect(suggestedDisplayName("Reetam Dutta", "rdutta_be23@thapar.edu")).toBe("Reetam Dutta");
    expect(suggestedDisplayName(null, "a@b.co")).toBe("");
  });
});

describe("photo choice", () => {
  it("accepts the four kinds and rejects anything else", () => {
    expect(isPhotoChoice({ kind: "keep" })).toBe(true);
    expect(isPhotoChoice({ kind: "none" })).toBe(true);
    expect(isPhotoChoice({ kind: "upload", url: "/uploads/ab12.png" })).toBe(true);
    expect(isPhotoChoice({ kind: "upload", url: "/uploads/ab12.pdf" })).toBe(false);
    expect(isPhotoChoice({ kind: "upload", url: "https://evil.example/x.png" })).toBe(false);
    expect(isPhotoChoice({ kind: "avatar", style: "face", seed: "abc123" })).toBe(true);
    expect(isPhotoChoice({ kind: "avatar", style: "face", seed: "<svg>" })).toBe(false);
    expect(isPhotoChoice({ kind: "avatar", style: "script", seed: "abc" })).toBe(false);
    expect(isPhotoChoice(null)).toBe(false);
  });
});

describe("generated avatars", () => {
  it("draws the same SVG for the same style and seed, and a different one for another seed", () => {
    for (const { id } of AVATAR_STYLES) {
      expect(isAvatarChoice(id, "seed1")).toBe(true);
      const first = avatarSvg(id, "seed1");
      expect(first).toBe(avatarSvg(id, "seed1"));
      expect(first).not.toBe(avatarSvg(id, "seed2"));
      expect(first.startsWith("<svg")).toBe(true);
      expect(first).not.toMatch(/NaN|undefined|<script/);
    }
  });
});
