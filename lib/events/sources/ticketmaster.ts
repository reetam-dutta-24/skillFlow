import { TICKETMASTER_DAILY_CAP, periodKey } from "@/lib/events/config";
import { eventsFromTicketmaster } from "@/lib/events/sources/ticketmaster-map";
import type { EventQuery, EventSourceAdapter, SourceResult } from "@/lib/events/sources/types";
import { reserveCall } from "@/lib/events/usage";

function stamp(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function search(query: EventQuery): Promise<SourceResult> {
  const apiKey = process.env.TICKETMASTER_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "off" };
  if (!(await reserveCall("ticketmaster", periodKey("day"), TICKETMASTER_DAILY_CAP))) {
    return { ok: false, error: "quota" };
  }

  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("keyword", query.keywords.slice(0, 3).join(" OR "));
  url.searchParams.set("latlong", `${query.lat},${query.lng}`);
  url.searchParams.set("radius", String(Math.min(Math.max(query.radiusKm, 1), 200)));
  url.searchParams.set("unit", "km");
  url.searchParams.set("startDateTime", stamp(query.from));
  url.searchParams.set("endDateTime", stamp(query.to));
  url.searchParams.set("size", "20");
  url.searchParams.set("sort", "date,asc");

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { ok: false, error: `http ${response.status}` };
    const payload: unknown = await response.json();
    return { ok: true, events: eventsFromTicketmaster(payload, query.from) };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export const ticketmasterSource: EventSourceAdapter = {
  id: "TICKETMASTER",
  label: "Ticketmaster",
  isConfigured: () => Boolean(process.env.TICKETMASTER_API_KEY?.trim()),
  search,
};
