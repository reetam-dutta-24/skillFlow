import "server-only";
import { ACTIVITY_KINDS, loadActivity, type ActivityKind } from "@/lib/activity";
import { auth } from "@/lib/auth";
import { loadCatalog } from "@/lib/data/catalog";
import { retentionFor } from "@/lib/explain/recall-store";
import { prisma } from "@/lib/prisma";
import { loadProgressStats, type ProgressStats } from "@/lib/progress/stats";
import { ideaKey } from "@/lib/progress/weak-topics";

export type AnalyticsHistoryRow = { month: string; values: Record<string, number> };

export type TimelineItem = { id: string; kind: ActivityKind; title: string; detail: string; at: string; href: string | null };

export type AnalyticsData = {
  streak: number;
  longest: number;
  skills: { name: string; mastery: number }[];
  history: AnalyticsHistoryRow[];
  series: { key: string; name: string }[];
  week: { day: string; checks: number }[];
  insights: { title: string; body: string }[];
  reviewHref: string | null;
  totals: {
    contributions: number;
    activeDays: number;
    ideas: number;
    stagesPassed: number;
    retention: number | null;
    weakTopics: number;
  };
  /** The four groups the charts color, in fixed order, with their totals over the last 12 months. */
  groups: { id: ActivityGroup; name: string; count: number }[];
  /** The last 12 months, one row per month with a count per group. */
  months: ({ month: string; total: number } & Record<ActivityGroup, number>)[];
  /** Every kind on its own, for the table under the share chart. */
  kinds: { id: ActivityKind; name: string; count: number }[];
  /** Activity by weekday (UTC), Monday first. */
  weekdays: { day: string; count: number }[];
  /** Explain-back ideas: passed on the first answer, passed after more tries, or not passed yet. */
  outcomes: { name: string; count: number }[];
  /** Stages passed and left on each followed path. */
  paths: { name: string; passed: number; left: number; mastery: number }[];
  notesByPath: { name: string; count: number }[];
  recall: { when: string; score: number }[];
  timeline: TimelineItem[];
};

const KIND_NAMES: Record<ActivityKind, string> = {
  stages: "Stages passed",
  ideas: "Ideas explained",
  practice: "Practice notes",
  recalls: "Recalls",
  contributions: "Open Source",
  questions: "Questions",
  resources: "Resources suggested",
  videos: "Videos",
  events: "Events",
};

/** Nine kinds are too many colors for one chart, so the charts group them into four. */
export type ActivityGroup = "learn" | "practice" | "community" | "share";

export const ACTIVITY_GROUPS: { id: ActivityGroup; name: string; kinds: ActivityKind[] }[] = [
  { id: "learn", name: "Explain-back", kinds: ["stages", "ideas"] },
  { id: "practice", name: "Practice and recall", kinds: ["practice", "recalls"] },
  { id: "community", name: "Open Source", kinds: ["contributions", "questions"] },
  { id: "share", name: "Sharing", kinds: ["resources", "videos", "events"] },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function days(count: number) {
  return count === 1 ? "day" : "days";
}

function shortDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** The latest things this learner did, across every kind, newest first. Personal, read on the request. */
async function loadTimeline(userId: string, limit = 14): Promise<TimelineItem[]> {
  const take = limit;
  const [stages, notes, recalls, contributions, resources, videos, events] = await Promise.all([
    prisma.stageCompletion.findMany({
      where: { userId, explainBackPassed: true, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take,
      select: { id: true, completedAt: true, stage: { select: { id: true, title: true, skill: { select: { name: true } } } } },
    }),
    prisma.learnerNote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, kind: true, concept: true, createdAt: true, skill: { select: { name: true } } },
    }),
    prisma.recallCheck.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, quality: true, createdAt: true, note: { select: { concept: true } } },
    }),
    prisma.communityContribution.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, title: true, status: true, createdAt: true, skill: { select: { name: true } } },
    }),
    prisma.resourceSubmission.findMany({
      where: { submittedById: userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, title: true, createdAt: true, stage: { select: { title: true } } },
    }),
    prisma.creatorWork.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.event.findMany({
      where: { submittedById: userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  const items: TimelineItem[] = [
    ...stages.map((row) => ({
      id: `stage-${row.id}`,
      kind: "stages" as const,
      title: `Passed ${row.stage.title}`,
      detail: row.stage.skill.name,
      at: (row.completedAt ?? new Date(0)).toISOString(),
      href: `/lesson/${row.stage.id}`,
    })),
    ...notes.map((row) => ({
      id: `note-${row.id}`,
      kind: row.kind === "practice" ? ("practice" as const) : ("ideas" as const),
      title: row.kind === "practice" ? `Practiced ${row.concept}` : `Explained ${row.concept}`,
      detail: row.skill.name,
      at: row.createdAt.toISOString(),
      href: "/notes",
    })),
    ...recalls.map((row) => ({
      id: `recall-${row.id}`,
      kind: "recalls" as const,
      title: `Recalled ${row.note.concept}`,
      detail: `Rated ${row.quality}`,
      at: row.createdAt.toISOString(),
      href: "/notes",
    })),
    ...contributions.map((row) => ({
      id: `contribution-${row.id}`,
      kind: "contributions" as const,
      title: `Contributed ${row.title}`,
      detail: `${row.skill.name} · ${row.status === "MERGED" ? "published" : row.status === "CLOSED" ? "closed" : "in review"}`,
      at: row.createdAt.toISOString(),
      href: `/open-source/me/${row.id}`,
    })),
    ...resources.map((row) => ({
      id: `resource-${row.id}`,
      kind: "resources" as const,
      title: `Suggested ${row.title}`,
      detail: row.stage.title,
      at: row.createdAt.toISOString(),
      href: null,
    })),
    ...videos.map((row) => ({
      id: `video-${row.id}`,
      kind: "videos" as const,
      title: `Uploaded ${row.title}`,
      detail: "Creator studio",
      at: row.createdAt.toISOString(),
      href: "/creator",
    })),
    ...events.map((row) => ({
      id: `event-${row.id}`,
      kind: "events" as const,
      title: `Submitted ${row.title}`,
      detail: "Nearby events",
      at: row.createdAt.toISOString(),
      href: "/nearby/events",
    })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/** How each explain-back idea went: first answer, more tries, or not passed yet. */
async function loadOutcomes(userId: string) {
  const [misses, passed] = await Promise.all([
    prisma.explainBackAttempt.findMany({
      where: { userId, verdict: "NEEDS_IMPROVEMENT" },
      select: { initialExplanation: true, followUpQuestion: true, prompt: { select: { stageId: true } } },
    }),
    prisma.learnerNote.findMany({ where: { userId, kind: "stage" }, select: { stageId: true, concept: true } }),
  ]);
  const missed = new Set<string>();
  for (const row of misses) {
    const concept = row.followUpQuestion?.trim();
    if (concept && row.initialExplanation.startsWith(`${concept}\n`)) missed.add(ideaKey(row.prompt.stageId, concept));
  }
  const passedKeys = new Set(passed.flatMap((note) => (note.stageId ? [ideaKey(note.stageId, note.concept)] : [])));
  let first = 0;
  let retried = 0;
  for (const key of passedKeys) {
    if (missed.has(key)) retried += 1;
    else first += 1;
  }
  const open = [...missed].filter((key) => !passedKeys.has(key)).length;
  return [
    { name: "First answer", count: first },
    { name: "After more tries", count: retried },
    { name: "Not passed yet", count: open },
  ];
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const session = await auth();
  const userId = session?.user?.id;
  const catalog = await loadCatalog();
  const stats: ProgressStats | null = userId ? await loadProgressStats(userId, catalog) : null;
  const followed = catalog.filter((entry) => entry.skill.followed);
  const skills = followed.map((entry) => ({ name: entry.skill.name, mastery: entry.skill.masteryPercent }));

  const [activity, timeline, outcomes, retention, noteGroups, recallRows] = userId
    ? await Promise.all([
        loadActivity(userId),
        loadTimeline(userId),
        loadOutcomes(userId),
        retentionFor(userId),
        prisma.learnerNote.groupBy({ by: ["skillId"], where: { userId }, _count: { _all: true } }),
        prisma.recallCheck.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30, select: { score: true, createdAt: true } }),
      ])
    : [null, [], [], null, [], []];

  const streak = stats?.currentStreak ?? 0;
  const longest = stats?.longestStreak ?? 0;

  const ranked = [...skills].sort((a, b) => b.mastery - a.mastery);
  const leader = ranked[0];
  const trailer = ranked[ranked.length - 1];
  const skillInsight = !leader
    ? { title: "No path followed yet", body: "Follow a path to see how verified mastery splits." }
    : leader.mastery === 0
      ? { title: "Mastery has not started", body: "A stage counts once its explain-back passes." }
      : {
          title: `${leader.name.split(" ")[0]} is ahead`,
          body:
            trailer && trailer.name !== leader.name
              ? `${leader.name} is at ${leader.mastery}%. ${trailer.name} is at ${trailer.mastery}%.`
              : `${leader.name} is at ${leader.mastery}% verified mastery.`,
        };

  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const cell of activity?.heatmap.weeks.flat() ?? []) {
    const sunday = new Date(`${cell.day}T00:00:00.000Z`).getUTCDay();
    weekdayCounts[(sunday + 6) % 7] += cell.count;
  }
  const busiest = weekdayCounts.indexOf(Math.max(...weekdayCounts));
  const skillName = new Map(catalog.map((entry) => [entry.skill.id, entry.skill.name]));
  const firstTry = outcomes[0]?.count ?? 0;
  const ideaTotal = outcomes.reduce((sum, row) => sum + row.count, 0);

  return {
    streak,
    longest,
    skills,
    history: stats?.history ?? [],
    series: stats?.series ?? [],
    week: stats?.week ?? [],
    reviewHref: stats?.reviewHref ?? null,
    insights: [
      {
        title: streak === 0 ? "No streak yet" : `${streak} ${days(streak)} in a row`,
        body: streak === 0 ? `Your longest run is ${longest} ${days(longest)}. A saved note or explain-back starts a new one.` : `Your longest run is ${longest} ${days(longest)}.`,
      },
      skillInsight,
      ideaTotal
        ? {
            title: `${Math.round((firstTry / ideaTotal) * 100)}% on the first answer`,
            body: `${firstTry} of ${ideaTotal} explain-back ideas held the first time you explained them.`,
          }
        : { title: "No ideas explained yet", body: "Open a stage and explain it back. Each idea is reviewed one at a time." },
      weekdayCounts.some(Boolean)
        ? { title: `${WEEKDAYS[busiest]} is your busiest day`, body: `${weekdayCounts[busiest]} contributions landed on a ${WEEKDAYS[busiest]} in the last year.` }
        : { title: "No rhythm yet", body: "Your busiest weekday shows up once you have some activity." },
    ],
    totals: {
      contributions: activity?.heatmap.total ?? 0,
      activeDays: activity?.heatmap.activeDays ?? 0,
      ideas: activity?.byKind.find((kind) => kind.id === "ideas")?.count ?? 0,
      stagesPassed: followed.reduce((sum, entry) => sum + entry.stages.filter((stage) => stage.status === "passed").length, 0),
      retention,
      weakTopics: stats?.weakTopics.length ?? 0,
    },
    groups: ACTIVITY_GROUPS.map((group) => ({
      id: group.id,
      name: group.name,
      count: group.kinds.reduce((sum, kind) => sum + (activity?.byKind.find((row) => row.id === kind)?.count ?? 0), 0),
    })),
    months: (activity?.byMonth ?? []).map((month) => {
      const row = { month: month.label, total: month.total, learn: 0, practice: 0, community: 0, share: 0 };
      for (const group of ACTIVITY_GROUPS) row[group.id] = group.kinds.reduce((sum, kind) => sum + month.counts[kind], 0);
      return row;
    }),
    kinds: ACTIVITY_KINDS.map((kind) => ({
      id: kind.id,
      name: KIND_NAMES[kind.id],
      count: activity?.byKind.find((row) => row.id === kind.id)?.count ?? 0,
    })).filter((kind) => kind.count > 0),
    weekdays: WEEKDAYS.map((day, index) => ({ day, count: weekdayCounts[index] })),
    outcomes,
    paths: followed.map((entry) => {
      const passed = entry.stages.filter((stage) => stage.status === "passed").length;
      return { name: entry.skill.name, passed, left: Math.max(entry.stages.length - passed, 0), mastery: entry.skill.masteryPercent };
    }),
    notesByPath: noteGroups
      .map((row) => ({ name: skillName.get(row.skillId) ?? "Other", count: row._count._all }))
      .sort((a, b) => b.count - a.count),
    recall: [...recallRows].reverse().map((row) => ({ when: shortDate(row.createdAt), score: row.score })),
    timeline,
  };
}
