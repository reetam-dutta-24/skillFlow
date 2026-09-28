import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { listSubmissions } from "@/lib/mock/catalog";
import type { SessionViewer } from "@/lib/types/domain";
import type { SubmissionsData } from "@/lib/types/pages";

/** The admin page must also reject non-admins with notFound(). This function only loads the queue. */
export async function getAdminSubmissions(viewer: SessionViewer): Promise<SubmissionsData> {
  await devDelay();
  return { items: listSubmissions(viewer) };
}
