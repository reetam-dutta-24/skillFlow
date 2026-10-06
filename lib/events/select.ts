import type { EventSource } from "@prisma/client";
import { distanceKm } from "@/lib/geo/distance";
import { DATE_RANGES, type DateRangeId } from "@/lib/events/config";

export type StoredEvent = {
  id: string;
  title: string;
  startsAt: Date;
  venueName: string | null;
  city: string | null;
  url: string;
  imageUrl: string | null;
  isOnline: boolean;
  source: EventSource;
  niche: string;
  lat: number | null;
  lng: number | null;
};

export type EventView = {
  id: string;
  title: string;
  startsAt: string;
  venueName: string | null;
  city: string | null;
  url: string;
  imageUrl: string | null;
  isOnline: boolean;
  sourceLabel: string;
  niche: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
};

const SOURCE_LABEL: Record<EventSource, string> = {
  TICKETMASTER: "via Ticketmaster",
  GOOGLE_EVENTS: "via Google Events",
  COMMUNITY: "Community",
};

export function sourceLabel(source: EventSource): string {
  return SOURCE_LABEL[source];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatEventWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getUTCDate();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${hours}:${minutes} UTC`;
}

export function rangeEnd(now: Date, range: DateRangeId): Date {
  return new Date(now.getTime() + DATE_RANGES[range].days * 24 * 60 * 60 * 1000);
}

/** Upcoming events inside the date window. In-person rows need a saved city and a distance. */
export function selectEvents(
  events: StoredEvent[],
  options: { origin: { lat: number; lng: number; city?: string } | null; km: number; now: Date; until: Date },
): { local: EventView[]; online: EventView[] } {
  const local: EventView[] = [];
  const online: EventView[] = [];

  for (const event of events) {
    if (event.startsAt.getTime() < options.now.getTime() || event.startsAt.getTime() > options.until.getTime()) continue;
    if (event.isOnline) {
      online.push(toView(event, null));
      continue;
    }
    if (!options.origin) continue;
    if (event.lat != null && event.lng != null) {
      const km = distanceKm(options.origin, { lat: event.lat, lng: event.lng });
      if (km > options.km) continue;
      local.push(toView(event, km));
      continue;
    }
    const named = event.city?.trim().toLowerCase();
    const home = options.origin.city?.trim().toLowerCase();
    if (named && home && (named === home || named.startsWith(`${home},`) || named.startsWith(`${home} `))) {
      local.push(toView(event, null));
    }
  }

  return { local, online };
}

function toView(event: StoredEvent, distance: number | null): EventView {
  return {
    id: event.id,
    title: event.title,
    startsAt: event.startsAt.toISOString(),
    venueName: event.venueName,
    city: event.city,
    url: event.url,
    imageUrl: event.imageUrl,
    isOnline: event.isOnline,
    sourceLabel: sourceLabel(event.source),
    niche: event.niche,
    lat: event.lat,
    lng: event.lng,
    distanceKm: distance,
  };
}
