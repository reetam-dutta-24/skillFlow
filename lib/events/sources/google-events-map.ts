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

  const monthMatch = value.match(/([A-Za-z]{3,9})\s+(\d{1,2})(?:[^0-9]+(\d{4}))?/);
  if (!monthMatch) return null;
  const month = MONTHS[monthMatch[1].toLowerCase()];
  if (month == null) return null;
  const day = Number(monthMatch[2]);
  let year = monthMatch[3] ? Number(monthMatch[3]) : now.getUTCFullYear();
  const time = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  let hours = 12;
  let minutes = 0;
  if (time) {
    hours = Number(time[1]) % 12;
    if (time[3].toUpperCase() === "PM") hours += 12;
    minutes = time[2] ? Number(time[2]) : 0;
  }
  let date = new Date(Date.UTC(year, month, day, hours, minutes));
  if (!monthMatch[3] && date.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
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

/** SerpApi `events_results` into saved events. Rows without a future date or a link are dropped. */
export function eventsFromGoogle(payload: unknown, now = new Date()): NormalizedEvent[] {
  const root = asRecord(payload);
  const rows = Array.isArray(root?.events_results) ? root.events_results : [];
  const events: NormalizedEvent[] = [];

  for (const row of rows) {
    const event = asRecord(row);
    if (!event) continue;
    const title = text(event.title);
    const url = text(event.link);
    const date = asRecord(event.date);
    const when = [text(date?.start_date), text(date?.when)].filter(Boolean).join(" ");
    const startsAt = when ? parseGoogleWhen(when, now) : null;
    if (!title || !url || !startsAt || startsAt.getTime() < now.getTime()) continue;

    const venue = asRecord(event.venue);
    const place = addressParts(event.address);
    const venueName = text(venue?.name) ?? place.venue;
    const haystack = `${title} ${venueName ?? ""} ${place.city ?? ""}`;

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
