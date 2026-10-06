import { describe, expect, it } from "vitest";
import { authorTransition, reviewTransition, unmergeTransition } from "@/lib/services/community/transitions";

describe("contribution status", () => {
  it("publishes an open post or rejects it", () => {
    expect(reviewTransition("OPEN", "APPROVE")).toEqual({ ok: true, status: "MERGED" });
    expect(reviewTransition("OPEN", "REQUEST_CHANGES").ok).toBe(false);
    expect(reviewTransition("CHANGES_REQUESTED", "APPROVE").ok).toBe(false);
    expect(reviewTransition("OPEN", "CLOSE")).toEqual({ ok: true, status: "CLOSED" });
    expect(reviewTransition("CHANGES_REQUESTED", "CLOSE")).toEqual({ ok: true, status: "CLOSED" });
  });

  it("sends an edit back to open, hides a resubmitted merge, and lets the author withdraw", () => {
    expect(authorTransition("CHANGES_REQUESTED", "edit")).toEqual({ ok: true, status: "OPEN" });
    expect(authorTransition("MERGED", "resubmit")).toEqual({ ok: true, status: "OPEN" });
    expect(authorTransition("MERGED", "edit").ok).toBe(false);
    expect(authorTransition("OPEN", "withdraw")).toEqual({ ok: true, status: "CLOSED" });
    expect(authorTransition("CLOSED", "withdraw").ok).toBe(false);
  });

  it("unmerges only a public contribution", () => {
    expect(unmergeTransition("MERGED")).toEqual({ ok: true, status: "CLOSED" });
    expect(unmergeTransition("OPEN").ok).toBe(false);
  });
});
