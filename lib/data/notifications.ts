import "server-only";
import { auth } from "@/lib/auth";
import { forBell, markRead, unreadByKind, type NotificationPrefs } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { streakReminderDue, utcDay } from "@/lib/progress/formula";
import type { NotificationKind, NotificationView } from "@/lib/types/domain";
import type { NotificationsData } from "@/lib/types/pages";

const WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;

type Draft = Omit<NotificationView, "read">;

function timeLabel(value: Date) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((start.getTime() - day.getTime()) / DAY_MS);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return value.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function note(kind: NotificationKind, icon: string, id: string, at: Date, title: string, message: string, href: string | null): Draft {
  return { id, kind, icon, title, message, at: at.toISOString(), timeLabel: timeLabel(at), href };
}

function quoted(text: string, max = 80) {
  const flat = text.replace(/\s+/g, " ").trim();
  return `"${flat.length > max ? `${flat.slice(0, max - 1)}…` : flat}"`;
}

/**
 * Every note for this learner over the last 30 days, before their switches, with read marks.
 * Personal: read on the request, never cached.
 */
export async function collectNotifications(userId: string, now = new Date()) {
  const since = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);
  const [user, submissions, reviews, works, events, asked, answered] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastActivityDate: true,
        learnerProfile: { select: { streakReminder: true, notifyReviews: true, notifyCommunity: true, notificationsReadAt: true } },
      },
    }),
    prisma.resourceSubmission.findMany({
      where: { submittedById: userId, status: { in: ["APPROVED", "REJECTED"] }, reviewedAt: { gte: since } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      select: { id: true, title: true, status: true, reviewNotes: true, reviewedAt: true, stage: { select: { id: true, title: true } } },
    }),
    // Decisions other people made on this learner's Open Source contributions.
    prisma.contributionReview.findMany({
      where: {
        createdAt: { gte: since },
        contribution: { authorId: userId },
        OR: [{ reviewerId: null }, { reviewerId: { not: userId } }],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        decision: true,
        unmerge: true,
        feedback: true,
        createdAt: true,
        contribution: { select: { id: true, title: true, skill: { select: { slug: true } } } },
      },
    }),
    prisma.creatorWork.findMany({
      where: { ownerId: userId, status: { in: ["LIVE", "REJECTED"] }, reviewedAt: { gte: since } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      select: { id: true, title: true, status: true, reviewNotes: true, reviewedAt: true },
    }),
    prisma.event.findMany({
      where: { submittedById: userId, source: "COMMUNITY", status: { in: ["APPROVED", "REJECTED"] }, updatedAt: { gte: since } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, title: true, status: true, reviewNote: true, updatedAt: true },
    }),
    // Questions other learners asked on this learner's posts that still wait for an answer.
    prisma.contributionQuestion.findMany({
      where: { createdAt: { gte: since }, answeredAt: null, authorId: { not: userId }, contribution: { authorId: userId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, body: true, createdAt: true, contribution: { select: { id: true, title: true, skill: { select: { slug: true } } } } },
    }),
    prisma.contributionQuestion.findMany({
      where: { authorId: userId, answeredAt: { gte: since } },
      orderBy: { answeredAt: "desc" },
      take: 20,
      select: { id: true, answeredAt: true, contribution: { select: { id: true, title: true, skill: { select: { slug: true } } } } },
    }),
  ]);

  const drafts: Draft[] = [];
  for (const row of submissions) {
    const at = row.reviewedAt ?? now;
    const approved = row.status === "APPROVED";
    const reviewNote = row.reviewNotes?.trim();
    drafts.push(
      note(
        "reviews",
        approved ? "circle-check" : "circle-alert",
        `submission-${row.id}`,
        at,
        approved ? "Your suggested resource was approved" : "Your suggested resource needs changes",
        approved ? `${quoted(row.title)} is on the ${row.stage.title} stage.` : reviewNote ? `The review note: ${reviewNote}` : `${quoted(row.title)} was not added.`,
        `/lesson/${row.stage.id}`,
      ),
    );
  }
  for (const row of reviews) {
    const post = row.contribution;
    const href = `/open-source/me/${post.id}`;
    if (row.decision === "APPROVE") {
      drafts.push(note("reviews", "git-merge", `review-${row.id}`, row.createdAt, "Your contribution was published", `${quoted(post.title)} is public now.`, `/open-source/${post.skill.slug}/c/${post.id}`));
    } else if (row.decision === "REQUEST_CHANGES") {
      drafts.push(note("reviews", "pencil", `review-${row.id}`, row.createdAt, "A reviewer asked for changes", `${quoted(post.title)}${row.feedback ? `: ${row.feedback.trim()}` : ""}`, href));
    } else {
      drafts.push(
        note(
          "reviews",
          "circle-x",
          `review-${row.id}`,
          row.createdAt,
          row.unmerge ? "Your contribution was hidden" : "Your contribution was not published",
          `${quoted(post.title)}${row.feedback ? `: ${row.feedback.trim()}` : ""}`,
          href,
        ),
      );
    }
  }
  for (const row of works) {
    const live = row.status === "LIVE";
    drafts.push(
      note(
        "reviews",
        live ? "clapperboard" : "circle-alert",
        `video-${row.id}`,
        row.reviewedAt ?? now,
        live ? "Your video is live" : "Your video was not approved",
        live ? `${quoted(row.title)} is on the clip feed.` : row.reviewNotes?.trim() || `${quoted(row.title)} needs another look.`,
        "/creator",
      ),
    );
  }
  for (const row of events) {
    const approved = row.status === "APPROVED";
    drafts.push(
      note(
        "reviews",
        approved ? "calendar-check" : "calendar-x",
        `event-${row.id}`,
        row.updatedAt,
        approved ? "Your event was approved" : "Your event was not approved",
        approved ? `${quoted(row.title)} is listed on Nearby.` : row.reviewNote?.trim() || `${quoted(row.title)} was not listed.`,
        "/nearby/events",
      ),
    );
  }
  for (const row of asked) {
    const post = row.contribution;
    drafts.push(
      note("community", "message-circle-question", `asked-${row.id}`, row.createdAt, "A learner asked about your post", `${quoted(row.body)} on ${quoted(post.title, 50)}.`, `/open-source/${post.skill.slug}/c/${post.id}`),
    );
  }
  for (const row of answered) {
    const post = row.contribution;
    drafts.push(
      note("community", "message-circle-reply", `answered-${row.id}`, row.answeredAt ?? now, "Your question was answered", `On ${quoted(post.title)}.`, `/open-source/${post.skill.slug}/c/${post.id}`),
    );
  }

  const profile = user?.learnerProfile;
  const today = utcDay(now);
  const lastDay = user?.lastActivityDate ? utcDay(user.lastActivityDate) : null;
  if (streakReminderDue({ enabled: true, lastDay, today })) {
    drafts.push(
      note("streak", "flame", `streak-${today}`, new Date(`${today}T00:00:00.000Z`), "Your streak is still open", "Yesterday counted. A note or an explain-back today keeps it.", "/dashboard"),
    );
  }

  const prefs: NotificationPrefs = {
    streak: profile?.streakReminder ?? true,
    reviews: profile?.notifyReviews ?? true,
    community: profile?.notifyCommunity ?? true,
  };
  const items = markRead(drafts, profile?.notificationsReadAt ?? null);
  return { items, prefs, unreadByKind: unreadByKind(items) };
}

export async function getNotifications(): Promise<NotificationsData> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { items: [], unread: 0 };
  const { items, prefs } = await collectNotifications(userId);
  return forBell(items, prefs);
}

/** "Mark all as read": the time is kept on the profile, so the count stays right on every device. */
export async function markNotificationsRead(userId: string, now = new Date()) {
  const updated = await prisma.learnerProfile.updateMany({ where: { userId }, data: { notificationsReadAt: now } });
  return updated.count > 0;
}
