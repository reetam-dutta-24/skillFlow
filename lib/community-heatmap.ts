/** Contribution heatmap: one column per week, Sunday at the top, the last 12 months in UTC. No chart library. */

export type HeatCell = { day: string; count: number; level: 0 | 1 | 2 | 3 | 4; label: string };

export type Heatmap = {
  weeks: HeatCell[][];
  /** Column index and short month name, where a new month starts. */
  months: { column: number; label: string }[];
  total: number;
  activeDays: number;
  busiest: { day: string; count: number } | null;
  summary: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "12 Sep 2026" */
export function dayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function cellLabel(key: string, count: number): string {
  if (count === 0) return `No contributions on ${dayLabel(key)}`;
  return `${count} ${count === 1 ? "contribution" : "contributions"} on ${dayLabel(key)}`;
}

function levelOf(count: number, max: number): HeatCell["level"] {
  if (count === 0 || max === 0) return 0;
  return Math.max(1, Math.min(4, Math.ceil((count / max) * 4))) as HeatCell["level"];
}

/** How the counted thing is named in labels and the summary. Open Source uses the default. */
export type HeatmapNoun = { one: string; many: string };
const MERGED: HeatmapNoun = { one: "merged contribution", many: "merged contributions" };

/** `counts` is the number per UTC day, keyed `YYYY-MM-DD`. */
export function buildHeatmap(counts: Map<string, number>, today: Date, noun: HeatmapNoun = MERGED): Heatmap {
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end.getTime() - 364 * DAY_MS);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  let max = 0;
  for (let time = start.getTime(); time <= end.getTime(); time += DAY_MS) {
    max = Math.max(max, counts.get(dayKey(new Date(time))) ?? 0);
  }

  const weeks: HeatCell[][] = [];
  const months: Heatmap["months"] = [];
  let total = 0;
  let activeDays = 0;
  let busiest: Heatmap["busiest"] = null;
  let lastMonth = -1;

  for (let time = start.getTime(); time <= end.getTime(); time += DAY_MS) {
    const date = new Date(time);
    const key = dayKey(date);
    const count = counts.get(key) ?? 0;
    if (date.getUTCDay() === 0) weeks.push([]);
    const week = weeks[weeks.length - 1];
    week.push({ day: key, count, level: levelOf(count, max), label: cellLabel(key, count) });

    if (week.length === 1 && date.getUTCMonth() !== lastMonth) {
      // Skip a label in the first column when the next month starts within two weeks, so labels do not overlap.
      const column = weeks.length - 1;
      if (column > 0 || date.getUTCDate() <= 14) months.push({ column, label: MONTHS[date.getUTCMonth()] });
      lastMonth = date.getUTCMonth();
    }

    if (count > 0) {
      total += count;
      activeDays += 1;
      if (!busiest || count > busiest.count) busiest = { day: key, count };
    }
  }

  const summary =
    total === 0
      ? `No ${noun.many} in the last 12 months.`
      : `${total} ${total === 1 ? noun.one : noun.many} on ${activeDays} ${activeDays === 1 ? "day" : "days"} in the last 12 months. The busiest day was ${dayLabel(busiest!.day)} with ${busiest!.count}.`;

  return { weeks, months, total, activeDays, busiest, summary };
}
