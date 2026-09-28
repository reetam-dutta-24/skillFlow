import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { listNotifications } from "@/lib/mock/catalog";
import type { NotificationsData } from "@/lib/types/pages";

export async function getNotifications(): Promise<NotificationsData> {
  await devDelay();
  return { items: listNotifications() };
}
