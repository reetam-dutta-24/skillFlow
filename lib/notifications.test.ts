import { describe, expect, it } from "vitest";
import { badgeLabel, forBell, markRead, unreadByKind } from "./notifications";
import type { NotificationKind } from "./types/domain";

function draft(id: string, kind: NotificationKind, at: string) {
  return { id, kind, icon: "bell", title: id, message: "", timeLabel: "Today", at, href: null };
}

const drafts = [
  draft("old-review", "reviews", "2026-10-01T10:00:00.000Z"),
  draft("new-review", "reviews", "2026-10-10T10:00:00.000Z"),
  draft("answer", "community", "2026-10-09T10:00:00.000Z"),
  draft("streak", "streak", "2026-10-11T00:00:00.000Z"),
];

describe("notifications", () => {
  it("treats every note as unread before the first mark", () => {
    expect(markRead(drafts, null).every((item) => !item.read)).toBe(true);
  });

  it("marks notes up to and including the read time", () => {
    const items = markRead(drafts, new Date("2026-10-09T10:00:00.000Z"));
    expect(items.filter((item) => !item.read).map((item) => item.id)).toEqual(["new-review", "streak"]);
    expect(unreadByKind(items)).toEqual({ streak: 1, reviews: 1, community: 0, detox: 0 });
  });

  it("keeps only the kinds that are switched on, newest first, and counts them", () => {
    const items = markRead(drafts, null);
    const bell = forBell(items, { streak: false, reviews: true, community: true, detox: true });
    expect(bell.items.map((item) => item.id)).toEqual(["new-review", "answer", "old-review"]);
    expect(bell.unread).toBe(3);
  });

  it("caps the badge so the bell keeps its size", () => {
    expect(badgeLabel(7)).toBe("7");
    expect(badgeLabel(140)).toBe("99+");
  });
});
