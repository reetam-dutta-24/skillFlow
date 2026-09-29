import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { listAdminQueue } from "@/lib/mock/catalog";

export async function getAdminQueue() {
  await devDelay();
  return listAdminQueue();
}
