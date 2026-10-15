/**
 * The Detox Score, in plain deterministic code. The same answers and the same activity always give the same number.
 * No model ever produces, predicts, or adjusts it.
 *
 *   baseline  = the self-check answers mapped onto -100..+100 (see baselineScore)
 *   progress  = points from verified learning, at most DAILY_CAP per UTC day, easing back after idle weeks
 *   check-in  = a small nudge from the latest weekly check-in, at most ±CHECKIN_LIMIT
 *   score     = clamp(round(baseline + progress + check-in), -100, +100)
 *
 * It is a self-improvement score from the learner's own answers and activity, not a medical test.
 */
import { RECALL_SCORES, type RecallQuality } from "@/lib/explain/recall";
import {
  DETOX_QUESTIONS,
  SCREEN_BANDS,
  isScreenBand,
  screenBand,
  type DetoxAnswers,
  type DetoxQuestion,
  type DetoxSection,
  type ScreenBand,
} from "./questions";

export const SCORE_MIN = -100;
export const SCORE_MAX = 100;

/** Points one verified action earns. Quality counts, not time: a strong recall is worth five weak ones. */
export const WEIGHTS = {
  idea: 1,
  stage: 2,
  recall: { strong: 1, partial: 0.5, weak: 0.2 } satisfies Record<RecallQuality, number>,
  note: 0.5,
  contribution: 1,
  /** Per 25 focused minutes, counted only from MIN_FOCUS_MINUTES. */
  focus: 1,
  /** Any verified action on a day: consistency matters more than volume. */
  activeDay: 0.5,
} as const;

/** The most a single UTC day can add, however long someone stays in the app. */
export const DAILY_CAP = 5;
export const MIN_FOCUS_MINUTES = 10;
/** After this many days without activity, progress eases back by DECAY_FACTOR, and again every such stretch. */
export const IDLE_DAYS = 7;
export const DECAY_FACTOR = 0.9;
export const CHECKIN_LIMIT = 10;

const DAY_MS = 86_400_000;

export function clampScore(value: number) {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(value)));
}

/* ── Answers ──────────────────────────────────────────────────────────────── */

/** Only known questions and options survive. Anything else from the client is dropped. */
export function cleanAnswers(raw: unknown): DetoxAnswers {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const clean: DetoxAnswers = {};
  for (const question of DETOX_QUESTIONS) {
    const value = source[question.id];
    const ids = new Set(question.options.map((option) => option.id));
    if (question.kind === "chips") {
      if (!Array.isArray(value)) continue;
      let picks = [...new Set(value.filter((item): item is string => typeof item === "string" && ids.has(item)))];
      // "None of these" cannot sit beside a real pick.
      if (question.noneId && picks.includes(question.noneId) && picks.length > 1) picks = picks.filter((id) => id !== question.noneId);
      if (picks.length) clean[question.id] = picks;
    } else if (typeof value === "string" && ids.has(value)) {
      clean[question.id] = value;
    }
  }
  return clean;
}

export function answerProgress(answers: DetoxAnswers) {
  const answered = DETOX_QUESTIONS.filter((question) => answers[question.id] !== undefined).length;
  const firstOpen = DETOX_QUESTIONS.findIndex((question) => answers[question.id] === undefined);
  return { answered, total: DETOX_QUESTIONS.length, complete: firstOpen === -1, firstOpen: firstOpen === -1 ? 0 : firstOpen };
}

/** Points one question adds. Chips add each pick, up to the cap; "none of these" adds its own (negative) points. */
export function questionPoints(question: DetoxQuestion, answer: string | string[] | undefined): number {
  if (answer === undefined) return 0;
  if (question.kind === "chips") {
    const picks = Array.isArray(answer) ? answer : [answer];
    const sum = picks.reduce((total, id) => total + (question.options.find((option) => option.id === id)?.points ?? 0), 0);
    return Math.min(sum, question.chipCap ?? sum);
  }
  return question.options.find((option) => option.id === answer)?.points ?? 0;
}

function pointRange(question: DetoxQuestion): [number, number] {
  const points = question.options.map((option) => option.points);
  if (question.kind === "chips") return [Math.min(0, ...points), question.chipCap ?? Math.max(...points)];
  return [Math.min(...points), Math.max(...points)];
}

/** The lowest and highest raw totals the questions allow. */
export const RAW_RANGE: [number, number] = DETOX_QUESTIONS.reduce<[number, number]>(
  ([low, high], question) => {
    const [min, max] = pointRange(question);
    return [low + min, high + max];
  },
  [0, 0],
);

export function rawPoints(answers: DetoxAnswers) {
  return DETOX_QUESTIONS.reduce((sum, question) => sum + questionPoints(question, answers[question.id]), 0);
}

/** The raw total placed on -100..+100: the lowest possible answers give -100, the highest +100. */
export function baselineScore(answers: DetoxAnswers) {
  const [low, high] = RAW_RANGE;
  return clampScore(((rawPoints(answers) - low) / (high - low)) * 200 - 100);
}

/** Each section as 0-100, where 100 is the healthiest answer. Used to pick guidance, never shown as a score. */
export function sectionScores(answers: DetoxAnswers): Record<DetoxSection, number> {
  const totals = new Map<DetoxSection, { got: number; low: number; high: number }>();
  for (const question of DETOX_QUESTIONS) {
    const [min, max] = pointRange(question);
    if (min === max) continue;
    const entry = totals.get(question.section) ?? { got: 0, low: 0, high: 0 };
    entry.got += questionPoints(question, answers[question.id]);
    entry.low += min;
    entry.high += max;
    totals.set(question.section, entry);
  }
  const result = {} as Record<DetoxSection, number>;
  for (const [section, entry] of totals) result[section] = Math.round(((entry.got - entry.low) / (entry.high - entry.low)) * 100);
  return result;
}

/** Very low mood, or overwhelm nearly every day. The page then shows support instead of detox tips. */
export function isDistress(answers: DetoxAnswers) {
  return answers.mood === "1" || answers.overwhelm === "always";
}

export function baselineScreen(answers: DetoxAnswers): ScreenBand {
  return isScreenBand(answers.screen) ? answers.screen : "2-4";
}

/* ── Bands ────────────────────────────────────────────────────────────────── */

export const BANDS = [
  { id: "overstimulated", label: "Overstimulated", min: SCORE_MIN, blurb: "Your attention is pulled in many directions. Small swaps add up quickly from here." },
  { id: "rebalancing", label: "Rebalancing", min: -30, blurb: "You are taking your attention back, one session at a time." },
  { id: "steady", label: "Steady", min: 10, blurb: "Real learning is crowding out the scroll." },
  { id: "deep", label: "Deep focus", min: 50, blurb: "Long, calm focus is becoming your normal." },
] as const;

export type Band = (typeof BANDS)[number];

export function bandFor(score: number): Band {
  return [...BANDS].reverse().find((band) => score >= band.min) ?? BANDS[0];
}

export function bandIndex(score: number) {
  return BANDS.findIndex((band) => band.id === bandFor(score).id);
}

/* ── Verified activity ────────────────────────────────────────────────────── */

export type DetoxEventKind = "idea" | "stage" | "recall" | "note" | "contribution" | "focus";
export type DetoxEvent = { at: Date; kind: DetoxEventKind; quality?: RecallQuality; minutes?: number };
export type DetoxCheckInInput = { weekStart: string; screenBand: ScreenBand; focus: number; at: Date };
export type DetoxInput = {
  baseline: number;
  baselineAt: Date;
  baselineScreen: ScreenBand;
  events: DetoxEvent[];
  checkIns: DetoxCheckInInput[];
};

export function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(key: string, days: number) {
  return dayKey(new Date(Date.parse(`${key}T00:00:00.000Z`) + days * DAY_MS));
}

/** Monday of the UTC week, YYYY-MM-DD. */
export function weekStartOf(date: Date) {
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return dayKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + offset)));
}

export function eventPoints(event: DetoxEvent): number {
  switch (event.kind) {
    case "idea":
      return WEIGHTS.idea;
    case "stage":
      return WEIGHTS.stage;
    case "recall":
      return WEIGHTS.recall[event.quality ?? "weak"];
    case "note":
      return WEIGHTS.note;
    case "contribution":
      return WEIGHTS.contribution;
    case "focus": {
      const minutes = event.minutes ?? 0;
      return minutes >= MIN_FOCUS_MINUTES ? (minutes / 25) * WEIGHTS.focus : 0;
    }
  }
}

/** One day's earned points: every verified action plus one consistency bonus, then the daily cap. */
export function dayPoints(events: DetoxEvent[]) {
  const counted = events.filter((event) => eventPoints(event) > 0);
  if (counted.length === 0) return { raw: 0, earned: 0, capped: false };
  const raw = counted.reduce((sum, event) => sum + eventPoints(event), 0) + WEIGHTS.activeDay;
  return { raw, earned: Math.min(raw, DAILY_CAP), capped: raw > DAILY_CAP };
}

/** A weekly check-in nudges the score: screen time against the baseline answer, and focus around the middle of 1-5. */
export function checkInAdjustment(checkIn: Pick<DetoxCheckInInput, "screenBand" | "focus">, startScreen: ScreenBand) {
  const screenDelta = screenBand(checkIn.screenBand).points - screenBand(startScreen).points;
  const focus = Math.max(1, Math.min(5, Math.round(checkIn.focus)));
  const value = Math.round(screenDelta * 0.5 + (focus - 3) * 1.5);
  return Math.max(-CHECKIN_LIMIT, Math.min(CHECKIN_LIMIT, value));
}

export type DaySnapshot = { day: string; score: number; earned: number; capped: boolean; adjustment: number; decayed: boolean };

/** The score for every UTC day from the baseline to `now`. Activity before the baseline does not count. */
export function scoreTimeline(input: DetoxInput, now: Date): DaySnapshot[] {
  const start = dayKey(input.baselineAt);
  const end = dayKey(now);
  const byDay = new Map<string, DetoxEvent[]>();
  for (const event of input.events) {
    if (event.at.getTime() < input.baselineAt.getTime() || event.at.getTime() > now.getTime()) continue;
    const key = dayKey(event.at);
    byDay.set(key, [...(byDay.get(key) ?? []), event]);
  }
  const checkIns = [...input.checkIns].sort((a, b) => a.at.getTime() - b.at.getTime());
  const snapshots: DaySnapshot[] = [];
  let progress = 0;
  let idle = 0;
  for (let day = start; day <= end; day = addDays(day, 1)) {
    const { earned, capped } = dayPoints(byDay.get(day) ?? []);
    let decayed = false;
    if (earned > 0) {
      progress += earned;
      idle = 0;
    } else if (day !== start) {
      idle += 1;
      if (idle % IDLE_DAYS === 0 && progress !== 0) {
        progress *= DECAY_FACTOR;
        decayed = true;
      }
    }
    const latest = checkIns.filter((checkIn) => dayKey(checkIn.at) <= day).at(-1);
    const adjustment = latest ? checkInAdjustment(latest, input.baselineScreen) : 0;
    snapshots.push({ day, score: clampScore(input.baseline + progress + adjustment), earned, capped, adjustment, decayed });
  }
  return snapshots;
}

export function currentScore(input: DetoxInput, now: Date) {
  return scoreTimeline(input, now).at(-1)?.score ?? clampScore(input.baseline);
}

/* ── Explaining the change ────────────────────────────────────────────────── */

export type WeekCounts = {
  ideas: number;
  stages: number;
  recalls: number;
  notes: number;
  contributions: number;
  focusMinutes: number;
  focusedDays: number;
  activeDays: number;
  cappedDays: number;
};

function countWindow(events: DetoxEvent[], fromKey: string, toKey: string, snapshots: DaySnapshot[]): WeekCounts {
  const inside = events.filter((event) => {
    const key = dayKey(event.at);
    return key >= fromKey && key <= toKey;
  });
  const of = (kind: DetoxEventKind) => inside.filter((event) => event.kind === kind);
  const focus = of("focus").filter((event) => (event.minutes ?? 0) >= MIN_FOCUS_MINUTES);
  const window = snapshots.filter((snapshot) => snapshot.day >= fromKey && snapshot.day <= toKey);
  return {
    ideas: of("idea").length,
    stages: of("stage").length,
    recalls: of("recall").length,
    notes: of("note").length,
    contributions: of("contribution").length,
    focusMinutes: focus.reduce((sum, event) => sum + (event.minutes ?? 0), 0),
    focusedDays: new Set(focus.map((event) => dayKey(event.at))).size,
    activeDays: window.filter((snapshot) => snapshot.earned > 0).length,
    cappedDays: window.filter((snapshot) => snapshot.capped).length,
  };
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function hours(value: number) {
  const rounded = Math.round(value * 2) / 2;
  return `${rounded % 1 === 0 ? rounded : rounded.toFixed(1)} h`;
}

export type Breakdown = {
  change: number;
  score: number;
  previous: number;
  counts: WeekCounts;
  parts: string[];
  /** One plain sentence, e.g. "+6 this week: 9 ideas passed, 4 focused days, screen time down 2 h". */
  summary: string;
  decayed: boolean;
};

/** What moved the score over the last seven days, in words. */
export function weeklyBreakdown(input: DetoxInput, now: Date): Breakdown {
  const snapshots = scoreTimeline(input, now);
  const today = dayKey(now);
  const from = addDays(today, -6);
  const score = snapshots.at(-1)?.score ?? clampScore(input.baseline);
  const before = snapshots.filter((snapshot) => snapshot.day < from).at(-1);
  const previous = before?.score ?? clampScore(input.baseline);
  const counts = countWindow(
    input.events.filter((event) => event.at.getTime() >= input.baselineAt.getTime()),
    from,
    today,
    snapshots,
  );

  const parts: string[] = [];
  if (counts.ideas) parts.push(plural(counts.ideas, "idea passed", "ideas passed"));
  if (counts.stages) parts.push(plural(counts.stages, "stage passed", "stages passed"));
  if (counts.recalls) parts.push(plural(counts.recalls, "recall answered", "recalls answered"));
  if (counts.focusedDays) parts.push(plural(counts.focusedDays, "focused day", "focused days"));
  if (counts.notes) parts.push(plural(counts.notes, "practice note", "practice notes"));
  if (counts.contributions) parts.push(plural(counts.contributions, "contribution", "contributions"));

  const sorted = [...input.checkIns].sort((a, b) => a.at.getTime() - b.at.getTime());
  const latest = sorted.filter((checkIn) => dayKey(checkIn.at) >= from && dayKey(checkIn.at) <= today).at(-1);
  if (latest) {
    const earlier = sorted.filter((checkIn) => checkIn.at.getTime() < latest.at.getTime()).at(-1);
    const was = screenBand(earlier?.screenBand ?? input.baselineScreen).hours;
    const now = screenBand(latest.screenBand).hours;
    if (now < was) parts.push(`screen time down ${hours(was - now)}`);
    else if (now > was) parts.push(`screen time up ${hours(now - was)}`);
    else parts.push("screen time steady");
  }
  if (counts.cappedDays) parts.push(plural(counts.cappedDays, "day at the daily limit", "days at the daily limit"));

  const decayed = snapshots.filter((snapshot) => snapshot.day >= from).some((snapshot) => snapshot.decayed);
  const change = score - previous;
  const sign = change > 0 ? `+${change}` : String(change);
  let summary: string;
  if (parts.length) summary = `${sign} this week: ${parts.join(", ")}`;
  else if (decayed) summary = `${sign} this week: a quiet week, so your score eased back toward where you started`;
  else summary = "No change yet this week. One explained idea starts it moving.";
  return { change, score, previous, counts, parts, summary, decayed };
}

/* ── Totals and weekly series for the page ────────────────────────────────── */

export type DetoxKpis = {
  daysActive: number;
  ideasPassed: number;
  focusedMinutes: number;
  averageRecall: number | null;
  screenFrom: ScreenBand;
  screenTo: ScreenBand | null;
};

export function detoxKpis(input: DetoxInput, now: Date): DetoxKpis {
  const events = input.events.filter((event) => event.at >= input.baselineAt && event.at <= now);
  const snapshots = scoreTimeline(input, now);
  const recalls = events.filter((event) => event.kind === "recall");
  const latest = [...input.checkIns].sort((a, b) => a.at.getTime() - b.at.getTime()).at(-1);
  return {
    daysActive: snapshots.filter((snapshot) => snapshot.earned > 0).length,
    ideasPassed: events.filter((event) => event.kind === "idea").length,
    focusedMinutes: events.filter((event) => event.kind === "focus").reduce((sum, event) => sum + (event.minutes ?? 0), 0),
    averageRecall: recalls.length
      ? Math.round(recalls.reduce((sum, event) => sum + RECALL_SCORES[event.quality ?? "weak"], 0) / recalls.length)
      : null,
    screenFrom: input.baselineScreen,
    screenTo: latest?.screenBand ?? null,
  };
}

export type DetoxWeek = {
  weekStart: string;
  label: string;
  score: number;
  focusMinutes: number;
  learning: number;
  selfFocus: number | null;
  screenHours: number | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** One row per UTC week since the baseline (the last `limit` weeks): score at the week's end and what happened in it. */
export function weeklySeries(input: DetoxInput, now: Date, limit = 12): DetoxWeek[] {
  const snapshots = scoreTimeline(input, now);
  const bySnapshot = new Map(snapshots.map((snapshot) => [snapshot.day, snapshot.score]));
  const first = weekStartOf(input.baselineAt);
  const last = weekStartOf(now);
  const weeks: DetoxWeek[] = [];
  for (let week = first; week <= last; week = addDays(week, 7)) {
    const end = addDays(week, 6) < dayKey(now) ? addDays(week, 6) : dayKey(now);
    const score = bySnapshot.get(end) ?? snapshots.filter((snapshot) => snapshot.day <= end).at(-1)?.score ?? clampScore(input.baseline);
    const inside = input.events.filter((event) => {
      const key = dayKey(event.at);
      return event.at >= input.baselineAt && key >= week && key <= end;
    });
    const checkIn = input.checkIns.find((item) => item.weekStart === week);
    const date = new Date(`${week}T00:00:00.000Z`);
    weeks.push({
      weekStart: week,
      label: `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`,
      score,
      focusMinutes: inside.filter((event) => event.kind === "focus").reduce((sum, event) => sum + (event.minutes ?? 0), 0),
      learning: inside.filter((event) => event.kind !== "focus").length,
      selfFocus: checkIn ? checkIn.focus : null,
      screenHours: checkIn ? screenBand(checkIn.screenBand).hours : null,
    });
  }
  return weeks.slice(-limit);
}

export const MIX_LABELS: Record<DetoxEventKind, string> = {
  idea: "Ideas passed",
  stage: "Stages passed",
  recall: "Recalls",
  note: "Practice notes",
  contribution: "Open Source",
  focus: "Focus sessions",
};

/** How many of each verified action since the baseline. */
export function activityMix(input: DetoxInput, now: Date) {
  const counts = new Map<DetoxEventKind, number>();
  for (const event of input.events) {
    if (event.at < input.baselineAt || event.at > now || eventPoints(event) <= 0) continue;
    counts.set(event.kind, (counts.get(event.kind) ?? 0) + 1);
  }
  return (Object.keys(MIX_LABELS) as DetoxEventKind[])
    .map((kind) => ({ kind, label: MIX_LABELS[kind], count: counts.get(kind) ?? 0 }))
    .filter((row) => row.count > 0);
}

/* ── The weekly check-in ──────────────────────────────────────────────────── */

/** Due once the baseline is six days old and nothing was checked in this UTC week. */
export function checkInDue(input: { completedAt: Date | null; checkInWeeks: string[]; now: Date }) {
  if (!input.completedAt) return false;
  if (input.now.getTime() - input.completedAt.getTime() < 6 * DAY_MS) return false;
  return !input.checkInWeeks.includes(weekStartOf(input.now));
}

export const SCREEN_BAND_IDS = SCREEN_BANDS.map((band) => band.id);
