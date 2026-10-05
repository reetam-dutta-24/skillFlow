import { updateTag } from "next/cache";
import { accountTag, CATALOG_TAG, COMMUNITY_TAG, MAP_TAG } from "@/lib/cache/tags";

/** Drop the shared catalog immediately after an admin write. */
export function invalidateCatalog() {
  updateTag(CATALOG_TAG);
}

/** Drop one person's cached account row after their name changes. */
export function invalidateAccount(userId: string) {
  updateTag(accountTag(userId));
}

/** Drop shared community pages after a join, a useful mark, or a public count change. */
export function invalidateCommunity() {
  updateTag(COMMUNITY_TAG);
}

/** Drop city counts after someone saves a city or changes the map toggle. */
export function invalidateMap() {
  updateTag(MAP_TAG);
}
