/** A city the learner picked from search. Centre coordinates only. */
export type CityHit = {
  city: string;
  country: string;
  lat: number;
  lng: number;
  label: string;
};

/** One city bubble on the learner map. A count of people, never a person. */
export type MapCity = {
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
};

export type MapLearnerPoint = {
  city: string;
  country: string;
  lat: number;
  lng: number;
};

const DEFAULT_MIN_LEARNERS = 5;

/** Round a city centre so a street-level coordinate cannot be stored. About 1 km. */
export function roundCityCoord(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Fewest opted-in learners a city needs before it appears.
 * Set MAP_MIN_LEARNERS=1 in local `.env` while trying the map.
 */
export function mapMinLearners() {
  const parsed = Number.parseInt(process.env.MAP_MIN_LEARNERS ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_MIN_LEARNERS;
  return parsed;
}

/** Fold one row per learner into one row per city. Cities under `minimum` are dropped. */
export function groupLearnerCities(points: MapLearnerPoint[], minimum: number): MapCity[] {
  const groups = new Map<string, { city: string; country: string; lat: number; lng: number; count: number }>();

  for (const point of points) {
    const city = point.city.trim();
    const country = point.country.trim();
    if (!city || !country) continue;
    const key = `${city.toLowerCase()}|${country.toLowerCase()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.lat += point.lat;
      existing.lng += point.lng;
      existing.count += 1;
    } else {
      groups.set(key, { city, country, lat: point.lat, lng: point.lng, count: 1 });
    }
  }

  return [...groups.values()]
    .filter((group) => group.count >= minimum)
    .map((group) => ({
      city: group.city,
      country: group.country,
      lat: roundCityCoord(group.lat / group.count),
      lng: roundCityCoord(group.lng / group.count),
      count: group.count,
    }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
}
