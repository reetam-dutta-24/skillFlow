import "server-only";
import { auth } from "@/lib/auth";
import { loadCatalog } from "@/lib/data/catalog";
import { loadProgressStats, type ProgressStats } from "@/lib/progress/stats";

export type AnalyticsHistoryRow = { month: string; values: Record<string, number> };

export type AnalyticsData = {
  streak: number;
  longest: number;
  skills: { name: string; mastery: number }[];
  history: AnalyticsHistoryRow[];
  series: { key: string; name: string }[];
  week: { day: string; checks: number }[];
  explain: { name: string; count: number }[];
  insights: { title: string; body: string }[];
  reviewHref: string | null;
};

function days(count: number) {
  return count === 1 ? "day" : "days";
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const session = await auth();
  const userId = session?.user?.id;
  const catalog = await loadCatalog();
  const stats: ProgressStats | null = userId ? await loadProgressStats(userId, catalog) : null;
  const skills = catalog
    .filter((entry) => entry.skill.followed)
    .map((entry) => ({ name: entry.skill.name, mastery: entry.skill.masteryPercent }));

  const streak = stats?.currentStreak ?? 0;
  const longest = stats?.longestStreak ?? 0;
  const explainPassed = stats?.explainBacksPassed ?? 0;
  const explainNeeds = stats?.explainBacksNeedsWork ?? 0;

  const ranked = [...skills].sort((a, b) => b.mastery - a.mastery);
  const leader = ranked[0];
  const trailer = ranked[ranked.length - 1];

  const skillInsight = !leader
    ? {
        title: "No skill followed yet",
        body: "Follow a skill to see how verified mastery splits.",
      }
    : leader.mastery === 0
      ? {
          title: "Mastery has not started",
          body: `${skills.map((skill) => `${skill.name} is at 0%`).join(". ")}. A stage counts once its explain-back passes.`,
        }
      : {
          title: `${leader.name.split(" ")[0]} is ahead`,
          body:
            trailer && trailer.name !== leader.name
              ? `${leader.name} is at ${leader.mastery}%. ${trailer.name} is at ${trailer.mastery}%. The gap is verified mastery, not time watched.`
              : `${leader.name} is at ${leader.mastery}%. That is verified mastery, not time watched.`,
        };

  return {
    streak,
    longest,
    skills,
    history: stats?.history ?? [],
    series: stats?.series ?? [],
    week: stats?.week ?? [],
    explain: [
      { name: "Passed", count: explainPassed },
      { name: "Needs another look", count: explainNeeds },
    ],
    insights: [
      {
        title: streak === 0 ? "No streak yet" : `${streak} ${days(streak)} in a row`,
        body:
          streak === 0
            ? "A UTC day counts when an explain-back or a note is saved. Nothing on this account lands on consecutive days yet."
            : `A UTC day counts when an explain-back or a note is saved. The longest run is ${longest} ${days(longest)}.`,
      },
      skillInsight,
      {
        title: "Explain-backs",
        body: `${explainPassed} explain-back${explainPassed === 1 ? "" : "s"} passed, and ${explainNeeds} ${explainNeeds === 1 ? "needs" : "need"} another look.`,
      },
    ],
    reviewHref: stats?.reviewHref ?? null,
  };
}
