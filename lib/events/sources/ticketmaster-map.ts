import type { NormalizedEvent } from "@/lib/events/sources/types";

const ONLINE = /online|virtual|livestream|live stream/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function finite(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: unknown): Date | null {
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function bestImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  let best: { url: string; width: number } | null = null;
  for (const image of images) {
    const row = asRecord(image);
    const url = text(row?.url);
    if (!url) continue;
    const width = finite(row?.width) ?? 0;
    if (!best || width > best.width) best = { url, width };
  }
  return best?.url ?? null;
}

/** Ticketmaster Discovery `_embedded.events` into saved events. Drops anything without a date, a link, or a future start. */
export function eventsFromTicketmaster(payload: unknown, now = new Date()): NormalizedEvent[] {
  const root = asRecord(payload);
  const embedded = asRecord(root?._embedded);
  const rows = Array.isArray(embedded?.events) ? embedded.events : [];
  const events: NormalizedEvent[] = [];

  for (const row of rows) {
    const event = asRecord(row);
    if (!event) continue;
    const externalId = text(event.id);
    const title = text(event.name);
    const url = text(event.url);
    const dates = asRecord(event.dates);
    const start = asRecord(dates?.start);
    const startsAt = parseDate(start?.dateTime) ?? parseDate(start?.localDate);
    if (!externalId || !title || !url || !startsAt || startsAt.getTime() < now.getTime()) continue;

    const end = asRecord(dates?.end);
    const venues = asRecord(event._embedded)?.venues;
    const venue = Array.isArray(venues) ? asRecord(venues[0]) : null;
    const location = asRecord(venue?.location);
    const city = asRecord(venue?.city);
    const country = asRecord(venue?.country);
    const address = asRecord(venue?.address);
    const venueName = text(venue?.name);
    const haystack = `${title} ${venueName ?? ""}`;

    events.push({
      externalId,
      title: title.slice(0, 180),
      description: text(event.info) ?? text(event.pleaseNote),
      startsAt,
      endsAt: parseDate(end?.dateTime),
      venueName,
      address: text(address?.line1),
      city: text(city?.name),
      countryCode: text(country?.countryCode),
      lat: finite(location?.latitude),
      lng: finite(location?.longitude),
      url,
      imageUrl: bestImage(event.images),
      isOnline: ONLINE.test(haystack),
    });
  }

  return events;
}
