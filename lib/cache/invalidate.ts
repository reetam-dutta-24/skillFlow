import { updateTag } from "next/cache";
import { accountTag, CATALOG_TAG } from "@/lib/cache/tags";

/** Drop the shared catalog immediately after an admin write. */
export function invalidateCatalog() {
  updateTag(CATALOG_TAG);
}

/** Drop one person's cached account row after their name changes. */
export function invalidateAccount(userId: string) {
  updateTag(accountTag(userId));
}
