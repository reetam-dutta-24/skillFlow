import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { GEOCODE_TAG } from "@/lib/cache/tags";
import { roundCityCoord, type CityHit } from "@/lib/geo/cities";

export type { CityHit };

const PLACE_TYPES = new Set(["city", "town", "village", "municipality", "hamlet"]);

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  hamlet?: string;
  country?: string;
};

type NominatimRow = {
  lat?: string;
  lon?: string;
  type?: string;
  addresstype?: string;
  name?: string;
  display_name?: string;
  address?: NominatimAddress;
};

function normalizeQuery(query: string) {
  return query.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 80);
}

function settlementName(row: NominatimRow) {
  const address = row.address;
  const named = address?.city || address?.town || address?.village || address?.municipality || address?.hamlet;
  if (named) return named;
  const kind = row.addresstype || row.type;
  if (kind && PLACE_TYPES.has(kind) && row.name) return row.name;
  return null;
}

function toHit(row: NominatimRow): CityHit | null {
  const kind = row.addresstype || row.type || "";
  if (kind && !PLACE_TYPES.has(kind) && !row.address?.city && !row.address?.town) return null;
  const city = settlementName(row);
  const country = row.address?.country?.trim();
  const lat = Number(row.lat);
  const lng = Number(row.lon);
  if (!city || !country || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return {
    city,
    country,
    lat: roundCityCoord(lat),
    lng: roundCityCoord(lng),
    label: `${city}, ${country}`,
  };
}

/**
 * City lookup against OpenStreetMap Nominatim.
 * `"use cache"` stores the result for the normalized query, so typing the same
 * city again does not call Nominatim. Do not call `auth()` in here: the result
 * is the same for every visitor.
 */
async function searchCitiesCached(query: string): Promise<CityHit[]> {
  "use cache";
  cacheLife("days");
  cacheTag(GEOCODE_TAG);

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("q", query);

  const userAgent = process.env.GEOCODER_USER_AGENT?.trim() || "SkillFlow/1.0 (learner map)";
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": userAgent,
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Nominatim responded with ${response.status}`);
  }

  const rows = (await response.json()) as NominatimRow[];
  const seen = new Set<string>();
  const hits: CityHit[] = [];
  for (const row of rows) {
    const hit = toHit(row);
    if (!hit) continue;
    const key = `${hit.city.toLowerCase()}|${hit.country.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push(hit);
    if (hits.length === 6) break;
  }
  return hits;
}

export async function searchCities(raw: string): Promise<CityHit[]> {
  const query = normalizeQuery(raw);
  if (query.length < 2) return [];
  return searchCitiesCached(query);
}
