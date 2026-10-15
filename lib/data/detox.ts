import "server-only";
import { readGuidance, type DetoxGuidance } from "@/lib/detox/guidance-schema";
import { DETOX_VERSION, isScreenBand, type DetoxAnswers } from "@/lib/detox/questions";
import {
  activityMix,
  answerProgress,
  bandFor,
  baselineScreen,
  checkInDue,
  cleanAnswers,
  detoxKpis,
  isDistress,
  scoreTimeline,
  sectionScores,
  weekStartOf,
  weeklyBreakdown,
  weeklySeries,
  type DetoxCheckInInput,
  type DetoxEvent,
  type DetoxInput,
} from "@/lib/detox/score";
import type { RecallQuality } from "@/lib/explain/recall";
import { prisma } from "@/lib/prisma";

/**
 * Dopamine Detox data. Personal and sensitive: always read on the request, never inside "use cache", never shown to
 * other people unless the learner turns on "Show my Detox Score on my profile".
 */

export type DetoxState =
  | { status: "none" }
  | { status: "in-progress"; answers: DetoxAnswers; answered: number; total: number; firstOpen: number }
  | {
      status: "complete";
      answers: DetoxAnswers;
      baseline: number;
      completedAt: Date;
      version: number;
      guidance: DetoxGuidance | null;
    };

export async function loadDetoxState(userId: string): Promise<DetoxState> {
  const row = await prisma.detoxAssessment.findUnique({
    where: { userId },
    select: { answers: true, baselineScore: true, completedAt: true, version: true, guidance: true },
  });
  if (!row) return { status: "none" };
  const answers = cleanAnswers(row.answers);
  if (row.completedAt && row.baselineScore !== null) {
    return {
      status: "complete",
      answers,
      baseline: row.baselineScore,
      completedAt: row.completedAt,
      version: row.version,
      guidance: readGuidance(row.guidance),
    };
  }
  const progress = answerProgress(answers);
  return { status: "in-progress", answers, answered: progress.answered, total: progress.total, firstOpen: progress.firstOpen };
}

/** Verified learning since `since`, from the same sources as the activity heatmap, plus saved focus sessions. */
export async function loadDetoxEvents(userId: string, since: Date): Promise<DetoxEvent[]> {
  const recent = { gte: since };
  const [stages, notes, recalls, contributions, sessions] = await Promise.all([
    prisma.stageCompletion.findMany({ where: { userId, explainBackPassed: true, completedAt: recent }, select: { completedAt: true } }),
    prisma.learnerNote.findMany({ where: { userId, createdAt: recent }, select: { createdAt: true, kind: true } }),
    prisma.recallCheck.findMany({ where: { userId, createdAt: recent }, select: { createdAt: true, quality: true } }),
    prisma.communityContribution.findMany({ where: { authorId: userId, createdAt: recent }, select: { createdAt: true } }),
    prisma.focusSession.findMany({ where: { userId, endedAt: recent }, select: { endedAt: true, focusedMinutes: true } }),
  ]);
  const events: DetoxEvent[] = [];
  for (const row of stages) if (row.completedAt) events.push({ at: row.completedAt, kind: "stage" });
  for (const row of notes) events.push({ at: row.createdAt, kind: row.kind === "practice" ? "note" : "idea" });
  for (const row of recalls) {
    const quality: RecallQuality = row.quality === "strong" || row.quality === "partial" ? row.quality : "weak";
    events.push({ at: row.createdAt, kind: "recall", quality });
  }
  for (const row of contributions) events.push({ at: row.createdAt, kind: "contribution" });
  for (const row of sessions) events.push({ at: row.endedAt, kind: "focus", minutes: row.focusedMinutes });
  return events;
}

export async function loadCheckIns(userId: string): Promise<DetoxCheckInInput[]> {
  const rows = await prisma.detoxCheckIn.findMany({
    where: { userId },
    orderBy: { weekStart: "asc" },
    select: { weekStart: true, screenTimeBand: true, focusRating: true, updatedAt: true },
  });
  return rows
    .filter((row) => isScreenBand(row.screenTimeBand))
    .map((row) => ({
      weekStart: row.weekStart,
      screenBand: row.screenTimeBand as DetoxCheckInInput["screenBand"],
      focus: row.focusRating,
      at: row.updatedAt,
    }));
}

export async function loadDetoxInput(userId: string, baseline: number, completedAt: Date, answers: DetoxAnswers): Promise<DetoxInput> {
  const [events, checkIns] = await Promise.all([loadDetoxEvents(userId, completedAt), loadCheckIns(userId)]);
  return { baseline, baselineAt: completedAt, baselineScreen: baselineScreen(answers), events, checkIns };
}

export type DetoxOverview = Awaited<ReturnType<typeof loadDetoxOverview>>;

/** Everything the Detox page shows, worked out in lib/detox/score.ts from the stored rows. */
export async function loadDetoxOverview(userId: string, now = new Date()) {
  const state = await loadDetoxState(userId);
  if (state.status !== "complete") return { state, ready: null } as const;
  const input = await loadDetoxInput(userId, state.baseline, state.completedAt, state.answers);
  const timeline = scoreTimeline(input, now);
  const score = timeline.at(-1)?.score ?? state.baseline;
  const thisWeek = weekStartOf(now);
  const checkIn = input.checkIns.find((item) => item.weekStart === thisWeek) ?? null;
  return {
    state,
    ready: {
      score,
      band: bandFor(score),
      baseline: state.baseline,
      breakdown: weeklyBreakdown(input, now),
      kpis: detoxKpis(input, now),
      weeks: weeklySeries(input, now),
      mix: activityMix(input, now),
      sections: sectionScores(state.answers),
      distress: isDistress(state.answers),
      guidance: state.guidance,
      checkIn,
      checkInDue: checkInDue({ completedAt: state.completedAt, checkInWeeks: input.checkIns.map((item) => item.weekStart), now }),
      completedAt: state.completedAt,
      version: state.version,
      outdated: state.version !== DETOX_VERSION,
    },
  } as const;
}

/** The small version for Home: score, band, weekly change, and one next step. */
export async function loadDetoxCard(userId: string, now = new Date()) {
  const overview = await loadDetoxOverview(userId, now);
  if (!overview.ready) return { state: overview.state, ready: null } as const;
  const { score, band, breakdown, distress, guidance, checkInDue: due } = overview.ready;
  return { state: overview.state, ready: { score, band, change: breakdown.change, summary: breakdown.summary, distress, step: guidance?.steps[0] ?? null, checkInDue: due } } as const;
}

/** For the public profile: the score and band only, when the owner has switched it on. */
export async function loadPublicDetox(userId: string, now = new Date()) {
  const state = await loadDetoxState(userId);
  if (state.status !== "complete") return null;
  const input = await loadDetoxInput(userId, state.baseline, state.completedAt, state.answers);
  const score = scoreTimeline(input, now).at(-1)?.score ?? state.baseline;
  return { score, band: bandFor(score), baseline: state.baseline };
}
