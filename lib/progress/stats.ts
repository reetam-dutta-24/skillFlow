import "server-only";
import type { CatalogEntry } from "@/lib/data/catalog";
import { prisma } from "@/lib/prisma";
import {
  masteryAt,
  recentMonths,
  streakFromDays,
  utcDay,
  weekChecks,
} from "@/lib/progress/formula";
import type { MasteryPointView, WeakTopicView } from "@/lib/types/domain";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type ProgressStats = {
  currentStreak: number;
  longestStreak: number;
  explainBacksPassed: number;
  explainBacksNeedsWork: number;
  milestonesPassedThisWeek: number;
  week: { day: string; checks: number }[];
  pointsBySkillId: Map<string, MasteryPointView[]>;
  history: { month: string; values: Record<string, number> }[];
  series: { key: string; name: string }[];
  weakTopics: (WeakTopicView & { href: string })[];
  reviewHref: string | null;
};

function oneLine(text: string, max = 160) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1)}…`;
}

function emptyStats(now: Date): ProgressStats {
  const months = recentMonths(now);
  return {
    currentStreak: 0,
    longestStreak: 0,
    explainBacksPassed: 0,
    explainBacksNeedsWork: 0,
    milestonesPassedThisWeek: 0,
    week: weekChecks([], now),
    pointsBySkillId: new Map(),
    history: months.map((month) => ({ month: month.label, values: {} })),
    series: [],
    weakTopics: [],
    reviewHref: null,
  };
}

/**
 * Personal progress for Home, Progress, and Analytics.
 * Read on the request. Writing the stored streak and mastery does not touch the catalog cache.
 */
export async function loadProgressStats(userId: string, catalog: CatalogEntry[], now = new Date()): Promise<ProgressStats> {
  const [user, attempts, notes, completions, recalls] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
    }),
    prisma.explainBackAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        verdict: true,
        feedback: true,
        followUpQuestion: true,
        prompt: {
          select: {
            stage: {
              select: {
                id: true,
                title: true,
                skill: { select: { slug: true, name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.learnerNote.findMany({
      where: { userId },
      select: { createdAt: true },
    }),
    prisma.stageCompletion.findMany({
      where: { userId, explainBackPassed: true },
      select: { stageId: true, completedAt: true },
    }),
    prisma.recallCheck.findMany({
      where: { userId },
      select: { createdAt: true },
    }),
  ]);

  if (!user) return emptyStats(now);

  const activityDates = [
    ...attempts.map((row) => row.createdAt),
    ...notes.map((row) => row.createdAt),
    ...recalls.map((row) => row.createdAt),
  ];
  const streak = streakFromDays(activityDates.map(utcDay), utcDay(now));
  const lastAt = activityDates.reduce<Date | null>((latest, date) => {
    if (!latest || date.getTime() > latest.getTime()) return date;
    return latest;
  }, null);
  const storedDay = user.lastActivityDate ? utcDay(user.lastActivityDate) : null;
  const nextDay = lastAt ? utcDay(lastAt) : null;
  if (user.currentStreak !== streak.current || user.longestStreak !== streak.longest || storedDay !== nextDay) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: streak.current,
        longestStreak: streak.longest,
        lastActivityDate: lastAt,
      },
    });
  }

  const followed = catalog.filter((entry) => entry.skill.followed);
  const stored = await prisma.userSkillProgress.findMany({
    where: { userId },
    select: { skillId: true, masteryPercent: true },
  });
  for (const entry of followed) {
    const row = stored.find((item) => item.skillId === entry.skill.id);
    if (!row || Math.round(row.masteryPercent) === entry.skill.masteryPercent) continue;
    await prisma.userSkillProgress.update({
      where: { userId_skillId: { userId, skillId: entry.skill.id } },
      data: { masteryPercent: entry.skill.masteryPercent },
    });
  }

  const passedAt = new Map<string, Date>();
  for (const row of completions) {
    passedAt.set(row.stageId, row.completedAt ?? now);
  }
  const passedIds = new Set(passedAt.keys());
  const months = recentMonths(now);
  const pointsBySkillId = new Map<string, MasteryPointView[]>();
  const series = followed.map((entry) => ({ key: entry.skill.slug, name: entry.skill.name }));
  const history = months.map((month) => ({ month: month.label, values: {} as Record<string, number> }));

  for (const entry of followed) {
    const openIds = entry.stages.filter((stage) => stage.status !== "locked").map((stage) => stage.id);
    const points = months.map((month, index) => {
      const value = masteryAt(openIds, passedAt, month.end);
      history[index].values[entry.skill.slug] = value;
      return { month: month.label, value };
    });
    pointsBySkillId.set(entry.skill.id, points);
  }

  const weak = new Map<
    string,
    { topic: string; skillSlug: string; skillName: string; stageId: string; passed: number; needs: number; reason: string }
  >();
  for (const attempt of attempts) {
    const stage = attempt.prompt.stage;
    if (passedIds.has(stage.id)) continue;
    const bucket = weak.get(stage.id) ?? {
      topic: stage.title,
      skillSlug: stage.skill.slug,
      skillName: stage.skill.name,
      stageId: stage.id,
      passed: 0,
      needs: 0,
      reason: "",
    };
    if (attempt.verdict === "NEEDS_IMPROVEMENT") {
      bucket.needs += 1;
      if (!bucket.reason) {
        const concept = attempt.followUpQuestion?.trim();
        const review = oneLine(attempt.feedback);
        bucket.reason = concept ? oneLine(`${concept}. ${review}`, 180) : review;
      }
    } else {
      bucket.passed += 1;
    }
    weak.set(stage.id, bucket);
  }

  const weakTopics = [...weak.values()]
    .filter((topic) => topic.needs > 0)
    .map((topic) => {
      const total = topic.passed + topic.needs;
      return {
        id: topic.stageId,
        topic: topic.topic,
        skillSlug: topic.skillSlug,
        skillName: topic.skillName,
        stageId: topic.stageId,
        accuracy: total === 0 ? 0 : topic.passed / total,
        reason: topic.reason,
        href: `/milestone/${topic.stageId}`,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy || a.topic.localeCompare(b.topic))
    .slice(0, 6);

  const weekStart = now.getTime() - WEEK_MS;
  return {
    currentStreak: streak.current,
    longestStreak: streak.longest,
    explainBacksPassed: attempts.filter((row) => row.verdict === "PASSED").length,
    explainBacksNeedsWork: attempts.filter((row) => row.verdict === "NEEDS_IMPROVEMENT").length,
    milestonesPassedThisWeek: completions.filter((row) => (row.completedAt ?? now).getTime() >= weekStart).length,
    week: weekChecks(attempts.map((row) => row.createdAt), now),
    pointsBySkillId,
    history,
    series,
    weakTopics,
    reviewHref: weakTopics[0]?.href ?? null,
  };
}

/** Keep the stored streak and mastery in step after an explain-back is saved. */
export async function touchLearnerProgress(userId: string) {
  const { loadCatalog } = await import("@/lib/data/catalog");
  const catalog = await loadCatalog();
  await loadProgressStats(userId, catalog);
}
