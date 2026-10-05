import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { MAP_TAG } from "@/lib/cache/tags";
import { groupLearnerCities, mapMinLearners, type MapCity } from "@/lib/geo/cities";
import { prisma } from "@/lib/prisma";

export type { MapCity };
export { mapMinLearners };

async function queryMapCities(skillSlug: string | null, minimum: number): Promise<MapCity[]> {
  const skill = skillSlug
    ? await prisma.skill.findUnique({ where: { slug: skillSlug }, select: { id: true } })
    : null;
  if (skillSlug && !skill) return [];

  const rows = await prisma.learnerProfile.findMany({
    where: {
      showOnMap: true,
      city: { not: null },
      country: { not: null },
      lat: { not: null },
      lng: { not: null },
      ...(skill ? { user: { skillProgress: { some: { skillId: skill.id } } } } : {}),
    },
    select: { city: true, country: true, lat: true, lng: true },
  });

  const points = rows.flatMap((row) => {
    if (!row.city || !row.country || row.lat == null || row.lng == null) return [];
    return [{ city: row.city, country: row.country, lat: row.lat, lng: row.lng }];
  });
  return groupLearnerCities(points, minimum);
}

/** Production copy of the city counts. Same for every visitor of that niche. */
async function loadCachedMapCities(skillSlug: string | null, minimum: number): Promise<MapCity[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(MAP_TAG);
  return queryMapCities(skillSlug, minimum);
}

/**
 * Opted-in learners, counted per city. Names are never selected.
 * Development reads the database directly so the demo script shows up on refresh.
 * Production caches the totals and drops them when someone saves a city.
 */
export async function loadMapCities(skillSlug: string | null): Promise<MapCity[]> {
  const minimum = mapMinLearners();
  if (process.env.NODE_ENV !== "production") return queryMapCities(skillSlug, minimum);
  return loadCachedMapCities(skillSlug, minimum);
}
