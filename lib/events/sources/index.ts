import { googleEventsSource } from "@/lib/events/sources/google-events";
import { ticketmasterSource } from "@/lib/events/sources/ticketmaster";
import type { ApiSource, EventSourceAdapter } from "@/lib/events/sources/types";

export const EVENT_SOURCES: EventSourceAdapter[] = [ticketmasterSource, googleEventsSource];

export function connectedApiSources(): EventSourceAdapter[] {
  return EVENT_SOURCES.filter((source) => source.isConfigured());
}

export type ListedSource = { id: ApiSource | "COMMUNITY"; label: string };

/** Sources the page may name. A missing key is left off the list. Community is always on. */
export function listedSources(): ListedSource[] {
  const sources: ListedSource[] = connectedApiSources().map((source) => ({ id: source.id, label: source.label }));
  sources.push({ id: "COMMUNITY", label: "Community" });
  return sources;
}
