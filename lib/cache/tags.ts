/** Shared catalog: niches, stages, resources, clips, and the submit picker. */
export const CATALOG_TAG = "catalog";

/** Shared community pages: merged contributions, counts, gaps, and the changelog. */
export const COMMUNITY_TAG = "community";

export function accountTag(userId: string) {
  return `account:${userId}`;
}
