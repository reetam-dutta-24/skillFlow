/** Shared catalog: niches, stages, resources, clips, and the submit picker. */
export const CATALOG_TAG = "catalog";

/** Shared community pages: merged contributions, counts, gaps, and the changelog. */
export const COMMUNITY_TAG = "community";

/** City learner counts on the map. The same totals for every visitor of a niche. */
export const MAP_TAG = "learner-map";

/** Nominatim city search. The same result for every visitor who types the same city. */
export const GEOCODE_TAG = "geocode";

export function accountTag(userId: string) {
  return `account:${userId}`;
}
