import "server-only";
import { canUseLiveSearch } from "@/lib/events/access";
import type { EventView } from "@/lib/events/select";
import { sourceLabel } from "@/lib/events/select";
import { connectedApiSources } from "@/lib/events/sources";
import type { ApiSource, NormalizedEvent } from "@/lib/events/sources/types";

const HORIZON_MS = 92 * 24 * 60 * 60 * 1000;

export type LiveSearchInput = {
  role: string | null | undefined;
  keyword: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
};

/** A search that is not saved. Still counts against the source caps. */
export async function liveSearchEvents(
  input: LiveSearchInput,
): Promise<{ ok: true; events: EventView[] } | { ok: false; error: string }> {
  if (!canUseLiveSearch(input.role)) return { ok: false, error: "Premium · coming soon" };
  const keyword = input.keyword.trim().slice(0, 80);
  if (keyword.length < 2) return { ok: false, error: "Enter a keyword." };
  const sources = connectedApiSources();
  if (sources.length === 0) return { ok: false, error: "No event source is connected." };

  const from = new Date();
  const to = new Date(from.getTime() + HORIZON_MS);
  const events: EventView[] = [];
  for (const source of sources) {
    const result = await source.search({
      keywords: [keyword],
      city: input.city,
      country: input.country,
      lat: input.lat,
      lng: input.lng,
      radiusKm: 50,
      from,
      to,
    });
    if (!result.ok) continue;
    for (const event of result.events) events.push(toView(event, source.id));
  }
  events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return { ok: true, events };
}

function toView(event: NormalizedEvent, source: ApiSource): EventView {
  return {
    id: `${source}:${event.externalId}`,
    title: event.title,
    startsAt: event.startsAt.toISOString(),
    venueName: event.venueName,
    city: event.city,
    url: event.url,
    isOnline: event.isOnline,
    sourceLabel: sourceLabel(source),
    niche: "Live search",
    lat: event.lat,
    lng: event.lng,
    distanceKm: null,
  };
}
