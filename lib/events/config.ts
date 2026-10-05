/** Ticketmaster Discovery free tier. Hard limit, not an env override. */
export const TICKETMASTER_DAILY_CAP = 5000;

/** SerpApi free tier is 250 searches a month. The code stops at 200. */
export const SERPAPI_HARD_CAP = 200;

export const COMMUNITY_DAILY_CAP = 3;

export const DISTANCE_OPTIONS = [25, 50, 100, 200] as const;
export type DistanceKm = (typeof DISTANCE_OPTIONS)[number];

export const DATE_RANGES = {
  week: { label: "This week", days: 7 },
  month: { label: "This month", days: 31 },
  quarter: { label: "Next 3 months", days: 92 },
} as const;
export type DateRangeId = keyof typeof DATE_RANGES;

const DEFAULT_TTL_HOURS = 12;

export function eventsTtlMs(raw = process.env.EVENTS_TTL_HOURS): number {
  const hours = Number(raw);
  const safe = Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_TTL_HOURS;
  return safe * 60 * 60 * 1000;
}

export function isFetchStale(fetchedAt: Date | null, now = Date.now(), ttlMs = eventsTtlMs()): boolean {
  if (!fetchedAt) return true;
  return now - fetchedAt.getTime() >= ttlMs;
}

export function serpApiMonthlyCap(raw = process.env.SERPAPI_MONTHLY_CAP): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return SERPAPI_HARD_CAP;
  return Math.min(SERPAPI_HARD_CAP, Math.floor(parsed));
}

export function cronPairLimit(raw = process.env.EVENTS_CRON_PAIRS): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return 20;
  return Math.min(50, Math.floor(parsed));
}

export function cityKey(city: string, country: string): string {
  return `${city.trim().toLowerCase()}|${country.trim().toLowerCase()}`;
}

export function periodKey(kind: "day" | "month", date = new Date()): string {
  const iso = date.toISOString();
  return kind === "day" ? iso.slice(0, 10) : iso.slice(0, 7);
}

export function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function parseDistance(value: string | undefined): DistanceKm {
  const parsed = Number(value);
  return (DISTANCE_OPTIONS as readonly number[]).includes(parsed) ? (parsed as DistanceKm) : 50;
}

export function parseDateRange(value: string | undefined): DateRangeId {
  if (value === "week" || value === "month" || value === "quarter") return value;
  return "month";
}
