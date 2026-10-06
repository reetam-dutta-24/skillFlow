/** Explainable progress math. A day is a UTC calendar day. Stages that are not open are not in the mastery count. */

/**
 * No stages are held back on a free path. Every stage can be passed, so the
 * certificate can be earned when the path is finished. The next stage still
 * waits on this learner's explain-back.
 */
export const LOCKED_TAIL = 0;

/** Highest stage order that is structurally open on a path of this length. */
export function openStageLimit(stageCount: number) {
  if (stageCount <= 1) return stageCount;
  return Math.max(1, stageCount - LOCKED_TAIL);
}

export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayNumber(day: string): number {
  const [year, month, date] = day.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, date) / 86_400_000);
}

/** Passed open stages, as a percent. Zero open stages is 0, not a divide-by-zero. */
export function masteryShare(passedOpen: number, openCount: number): number {
  if (openCount <= 0 || passedOpen <= 0) return 0;
  return Math.round((100 * passedOpen) / openCount);
}

/** Same open-stage rule as the catalog: available, free, and not monetized. */
export function stageCountsAsOpen(input: {
  skillStatus: string;
  skillOffer: string;
  monetized: boolean;
  order: number;
  stageCount: number;
}): boolean {
  if (input.skillStatus !== "AVAILABLE" || input.skillOffer !== "FREE") return false;
  if (input.monetized) return false;
  return input.order <= openStageLimit(input.stageCount);
}

/**
 * Consecutive UTC days with a saved explain-back or a saved note.
 * The current run stays alive through today and yesterday. A gap sets it to 0.
 * The longest run is kept from the whole history.
 */
export function streakFromDays(days: readonly string[], today: string): { current: number; longest: number } {
  const unique = [...new Set(days.filter(Boolean))].sort();
  if (unique.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let index = 1; index < unique.length; index += 1) {
    const gap = dayNumber(unique[index]) - dayNumber(unique[index - 1]);
    run = gap === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  let trailing = 1;
  for (let index = unique.length - 1; index > 0; index -= 1) {
    const gap = dayNumber(unique[index]) - dayNumber(unique[index - 1]);
    if (gap !== 1) break;
    trailing += 1;
  }

  const since = dayNumber(today) - dayNumber(unique[unique.length - 1]);
  const current = since === 0 || since === 1 ? trailing : 0;
  return { current, longest };
}

export type MonthWindow = { label: string; end: Date };

/** Six UTC months ending at `now`. Earlier months close on their last millisecond. */
export function recentMonths(now: Date, count = 6): MonthWindow[] {
  const months: MonthWindow[] = [];
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const start = new Date(Date.UTC(year, month - offset, 1));
    const end =
      offset === 0
        ? now
        : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    const label = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(start);
    months.push({ label, end });
  }
  return months;
}

/** Share of today's open stages that had already passed by `end`. */
export function masteryAt(openStageIds: readonly string[], passedAt: ReadonlyMap<string, Date>, end: Date): number {
  let passed = 0;
  for (const id of openStageIds) {
    const at = passedAt.get(id);
    if (at && at.getTime() <= end.getTime()) passed += 1;
  }
  return masteryShare(passed, openStageIds.length);
}

/** One bar per UTC day for the last seven days, including today. Missing days are 0. */
export function weekChecks(dates: readonly Date[], now: Date): { day: string; checks: number }[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const key = utcDay(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const bars: { day: string; checks: number }[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(date);
    bars.push({ day, checks: counts.get(utcDay(date)) ?? 0 });
  }
  return bars;
}
