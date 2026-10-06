import { venueQueries } from "@/lib/events/venue-query";
import { geocodeVenue } from "@/lib/geo/nominatim";
import { periodKey, serpApiMonthlyCap } from "@/lib/events/config";
import { eventsFromGoogle } from "@/lib/events/sources/google-events-map";
import type { EventQuery, EventSourceAdapter, NormalizedEvent, SourceResult } from "@/lib/events/sources/types";
import { reserveCall } from "@/lib/events/usage";

async function placeOnVenues(events: NormalizedEvent[], query: EventQuery): Promise<NormalizedEvent[]> {
  const placed: NormalizedEvent[] = [];
  for (const event of events) {
    const city = event.city ?? query.city;
    if (event.isOnline || event.lat != null || event.lng != null) {
      placed.push({ ...event, city });
      continue;
    }
    const lookups = venueQueries({
      venueName: event.venueName,
      address: event.address,
      city,
      savedCity: query.city,
      country: query.country,
    });
    let hit: { lat: number; lng: number } | null = null;
    for (const lookup of lookups) {
      try {
        hit = await geocodeVenue(lookup);
      } catch {
        hit = null;
      }
      if (hit) break;
    }
    placed.push(hit ? { ...event, lat: hit.lat, lng: hit.lng, city } : { ...event, city });
  }
  return placed;
}

async function search(query: EventQuery): Promise<SourceResult> {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "off" };
  if (!(await reserveCall("serpapi", periodKey("month"), serpApiMonthlyCap()))) {
    return { ok: false, error: "quota" };
  }

  const url = new URL("https://serpapi.com/search.json");
  // Google retired the separate Events tab in September 2026. SerpApi rejects engine=google_events.
  // A normal Google search still returns the events carousel as events_results.
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", `${query.keywords.slice(0, 3).join(" ")} events in ${query.city}`);
  if (query.country.trim()) url.searchParams.set("location", `${query.city}, ${query.country}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("hl", "en");

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { ok: false, error: `http ${response.status}` };
    const payload: unknown = await response.json();
    return { ok: true, events: await placeOnVenues(eventsFromGoogle(payload, query.from), query) };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export const googleEventsSource: EventSourceAdapter = {
  id: "GOOGLE_EVENTS",
  label: "Google Events",
  isConfigured: () => Boolean(process.env.SERPAPI_API_KEY?.trim()),
  search,
};
