import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { listSubmissions } from "@/lib/mock/catalog";
import type { SessionViewer } from "@/lib/types/domain";
import type { SubmissionsData } from "@/lib/types/pages";

export async function getSubmissions(viewer: SessionViewer): Promise<SubmissionsData> {
  await devDelay();
  return { items: listSubmissions(viewer) };
}
