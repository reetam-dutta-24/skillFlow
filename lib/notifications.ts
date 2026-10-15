import type { NotificationKind, NotificationView } from "@/lib/types/domain";

export type NotificationPrefs = Record<NotificationKind, boolean>;

/** A note is unread when it happened after "mark all as read". Before the first mark, every note is unread. */
export function markRead(items: Omit<NotificationView, "read">[], readAt: Date | null): NotificationView[] {
  return items.map((item) => ({ ...item, read: readAt != null && new Date(item.at).getTime() <= readAt.getTime() }));
}

/** Unread notes per kind, for the switches in Settings. */
export function unreadByKind(items: NotificationView[]): Record<NotificationKind, number> {
  const counts: Record<NotificationKind, number> = { streak: 0, reviews: 0, community: 0, detox: 0 };
  for (const item of items) if (!item.read) counts[item.kind] += 1;
  return counts;
}

/** The bell's list: only the kinds this learner keeps on, newest first. */
export function forBell(items: NotificationView[], prefs: NotificationPrefs, limit = 25) {
  const shown = items
    .filter((item) => prefs[item.kind])
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
  return { items: shown, unread: shown.filter((item) => !item.read).length };
}

/** The badge text: a number, capped so the bell keeps its size. */
export function badgeLabel(unread: number) {
  return unread > 99 ? "99+" : String(unread);
}
