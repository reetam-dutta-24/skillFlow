import "server-only";
import type { SubmissionStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { streakReminderDue, utcDay } from "@/lib/progress/formula";
import type { NotificationView } from "@/lib/types/domain";
import type { NotificationsData } from "@/lib/types/pages";

function timeLabel(value: Date) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((start.getTime() - day.getTime()) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return value.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function toNotification(row: {
  id: string;
  title: string;
  status: SubmissionStatus;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  stage: { title: string };
}): NotificationView | null {
  if (row.status === "PENDING") return null;
  const when = row.reviewedAt ?? row.createdAt;
  if (row.status === "APPROVED") {
    return {
      id: row.id,
      title: "Your suggested resource was approved",
      message: `"${row.title}" is on the ${row.stage.title} stage.`,
      timeLabel: timeLabel(when),
      read: false,
    };
  }
  const note = row.reviewNotes?.trim();
  return {
    id: row.id,
    title: "Your suggested resource needs changes",
    message: note ? `The review note: ${note}` : `"${row.title}" was not added.`,
    timeLabel: timeLabel(when),
    read: false,
  };
}

export async function getNotifications(): Promise<NotificationsData> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { items: [] };

  const [rows, user] = await Promise.all([
    prisma.resourceSubmission.findMany({
    where: { submittedById: userId, status: { in: ["APPROVED", "REJECTED"] } },
    orderBy: [{ reviewedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      reviewNotes: true,
      reviewedAt: true,
      createdAt: true,
      stage: { select: { title: true } },
    },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastActivityDate: true,
        learnerProfile: { select: { streakReminder: true } },
      },
    }),
  ]);

  const items = rows.flatMap((row) => {
    const item = toNotification(row);
    return item ? [item] : [];
  });
  const today = utcDay(new Date());
  const lastDay = user?.lastActivityDate ? utcDay(user.lastActivityDate) : null;
  if (streakReminderDue({ enabled: user?.learnerProfile?.streakReminder ?? true, lastDay, today })) {
    items.unshift({
      id: "streak-reminder",
      title: "Your streak is still open",
      message: "Yesterday counted. A note or an explain-back today keeps it.",
      timeLabel: "Today",
      read: false,
    });
  }

  return { items };
}
