import type { NormalizedEvent } from "@/lib/events/sources/types";

const ONLINE = /online|virtual|livestream|live stream/i;

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Google Events dates are often "Nov 2" or a sentence. An ISO string wins when one is present. */
export function parseGoogleWhen(value: string, now: Date): Date | null {
  const iso = value.match(/\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)?/);
  if (iso) {
    const date = new Date(iso[0]);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const dated = value.replace(/\b\d{1,2}:\d{2}\s*(?:AM|PM)?/gi, " ").replace(/\b\d{1,2}\s*(?:AM|PM)\b/gi, " ");
  const monthFirst = dated.match(/([A-Za-z]{3,9})\s+(\d{1,2})(?:[^0-9]+(\d{4}))?/);
  const dayFirst = dated.match(/(\d{1,2})\s+([A-Za-z]{3,9})(?:[^0-9]+(\d{4}))?/);
  const monthMatch = monthFirst
    ? { monthName: monthFirst[1], day: monthFirst[2], year: monthFirst[3] }
    : dayFirst
      ? { monthName: dayFirst[2], day: dayFirst[1], year: dayFirst[3] }
      : null;
  if (!monthMatch) return null;
  const month = MONTHS[monthMatch.monthName.toLowerCase()];
  if (month == null) return null;
  const day = Number(monthMatch.day);
  let year = monthMatch.year ? Number(monthMatch.year) : now.getUTCFullYear();
  const ampm = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  const clock = value.match(/\b(\d{1,2}):(\d{2})\b/);
  let hours = 12;
  let minutes = 0;
  if (ampm) {
    hours = Number(ampm[1]) % 12;
    if (ampm[3].toUpperCase() === "PM") hours += 12;
    minutes = ampm[2] ? Number(ampm[2]) : 0;
  } else if (clock && Number(clock[1]) <= 23 && Number(clock[2]) <= 59) {
    hours = Number(clock[1]);
    minutes = Number(clock[2]);
  }
  let date = new Date(Date.UTC(year, month, day, hours, minutes));
  if (!monthMatch.year && date.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
    year += 1;
    date = new Date(Date.UTC(year, month, day, hours, minutes));
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

function addressParts(address: unknown): { venue: string | null; city: string | null } {
  if (Array.isArray(address)) {
    const lines = address.filter((line): line is string => typeof line === "string" && line.trim().length > 0);
    return { venue: lines[0] ?? null, city: lines[1] ?? lines[0] ?? null };
  }
  const line = text(address);
  return { venue: line, city: line };
}

function googleSearchLink(title: string, venue: string | null): string {
  const query = [title, venue].filter(Boolean).join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/** SerpApi `events_results` into saved events. Rows without a future date are dropped. */
export function eventsFromGoogle(payload: unknown, now = new Date()): NormalizedEvent[] {
  const root = asRecord(payload);
  const rows = Array.isArray(root?.events_results) ? root.events_results : [];
  const events: NormalizedEvent[] = [];

  for (const row of rows) {
    const event = asRecord(row);
    if (!event) continue;
    const title = text(event.title);
    const dateText = text(event.date);
    const date = asRecord(event.date);
    const when = [dateText, text(date?.start_date), text(date?.when), text(event.time)].filter(Boolean).join(" ");
    const startsAt = when ? parseGoogleWhen(when, now) : null;
    if (!title || !startsAt || startsAt.getTime() < now.getTime()) continue;

    const venue = asRecord(event.venue);
    const place = addressParts(event.address);
    const venueName = text(venue?.name) ?? place.venue;
    const haystack = `${title} ${venueName ?? ""} ${place.city ?? ""}`;
    const url = text(event.link) ?? googleSearchLink(title, venueName);

    events.push({
      externalId: url.slice(0, 180),
      title: title.slice(0, 180),
      description: text(event.description),
      startsAt,
      endsAt: null,
      venueName,
      address: place.venue,
      city: place.city,
      countryCode: null,
      lat: null,
      lng: null,
      url,
      imageUrl: text(event.thumbnail),
      isOnline: ONLINE.test(haystack),
    });
  }

  return events;
}
