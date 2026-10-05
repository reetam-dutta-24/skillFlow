export type ApiSource = "TICKETMASTER" | "GOOGLE_EVENTS";

export type NormalizedEvent = {
  externalId: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
  url: string;
  imageUrl: string | null;
  isOnline: boolean;
};

export type EventQuery = {
  keywords: string[];
  city: string;
  country: string;
  lat: number;
  lng: number;
  radiusKm: number;
  from: Date;
  to: Date;
};

export type SourceResult =
  | { ok: true; events: NormalizedEvent[] }
  | { ok: false; error: string };

export interface EventSourceAdapter {
  id: ApiSource;
  label: string;
  isConfigured: () => boolean;
  search: (query: EventQuery) => Promise<SourceResult>;
}
