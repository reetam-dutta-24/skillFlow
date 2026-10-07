import "server-only";
import { buildHeatmap, dayKey, type Heatmap } from "@/lib/community-heatmap";
import { prisma } from "@/lib/prisma";

/** Every action that counts as a contribution on the activity heatmap, in the order the breakdown lists them. */
export const ACTIVITY_KINDS = [
  { id: "stages", one: "stage completed", many: "stages completed" },
  { id: "ideas", one: "idea explained", many: "ideas explained" },
  { id: "practice", one: "practice note", many: "practice notes" },
  { id: "recalls", one: "recall answered", many: "recalls answered" },
  { id: "contributions", one: "Open Source contribution", many: "Open Source contributions" },
  { id: "questions", one: "question asked or answered", many: "questions asked or answered" },
  { id: "resources", one: "resource suggested", many: "resources suggested" },
  { id: "videos", one: "video uploaded", many: "videos uploaded" },
  { id: "events", one: "event submitted", many: "events submitted" },
] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number]["id"];
export type Activity = { heatmap: Heatmap; byKind: { id: ActivityKind; label: string; count: number }[] };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One learner's contributions per UTC day over the last 12 months: stages passed, ideas explained, practice notes,
 * recall answers, Open Source contributions, questions and answers, suggested resources, uploaded videos, and
 * submitted events. Counts only; no content. Personal, so callers read it on the request.
 */
export async function loadActivity(userId: string, now = new Date()): Promise<Activity> {
  const since = new Date(now.getTime() - 371 * DAY_MS);
  const recent = { gte: since };
  const [stages, notes, recalls, contributions, questions, answers, resources, videos, events] = await Promise.all([
    prisma.stageCompletion.findMany({ where: { userId, explainBackPassed: true, completedAt: recent }, select: { completedAt: true } }),
    prisma.learnerNote.findMany({ where: { userId, createdAt: recent }, select: { createdAt: true, kind: true } }),
    prisma.recallCheck.findMany({ where: { userId, createdAt: recent }, select: { createdAt: true } }),
    prisma.communityContribution.findMany({ where: { authorId: userId, createdAt: recent }, select: { createdAt: true } }),
    prisma.contributionQuestion.findMany({ where: { authorId: userId, createdAt: recent }, select: { createdAt: true } }),
    prisma.contributionQuestion.findMany({
      where: { contribution: { authorId: userId }, answeredAt: recent },
      select: { answeredAt: true },
    }),
    prisma.resourceSubmission.findMany({ where: { submittedById: userId, createdAt: recent }, select: { createdAt: true } }),
    prisma.creatorWork.findMany({ where: { ownerId: userId, createdAt: recent }, select: { createdAt: true } }),
    prisma.event.findMany({ where: { submittedById: userId, createdAt: recent }, select: { createdAt: true } }),
  ]);

  const perDay = new Map<string, number>();
  const totals: Record<ActivityKind, number> = {
    stages: 0, ideas: 0, practice: 0, recalls: 0, contributions: 0, questions: 0, resources: 0, videos: 0, events: 0,
  };
  const add = (kind: ActivityKind, date: Date | null) => {
    if (!date) return;
    const key = dayKey(date);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
    totals[kind] += 1;
  };
  stages.forEach((row) => add("stages", row.completedAt));
  notes.forEach((row) => add(row.kind === "practice" ? "practice" : "ideas", row.createdAt));
  recalls.forEach((row) => add("recalls", row.createdAt));
  contributions.forEach((row) => add("contributions", row.createdAt));
  questions.forEach((row) => add("questions", row.createdAt));
  answers.forEach((row) => add("questions", row.answeredAt));
  resources.forEach((row) => add("resources", row.createdAt));
  videos.forEach((row) => add("videos", row.createdAt));
  events.forEach((row) => add("events", row.createdAt));

  return {
    heatmap: buildHeatmap(perDay, now, { one: "contribution", many: "contributions" }),
    byKind: ACTIVITY_KINDS.map((kind) => ({
      id: kind.id,
      label: totals[kind.id] === 1 ? kind.one : kind.many,
      count: totals[kind.id],
    })).filter((kind) => kind.count > 0),
  };
}
