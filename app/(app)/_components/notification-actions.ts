"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { markNotificationsRead } from "@/lib/data/notifications";

/** Saves "mark all as read" on the profile, so the bell count stays at zero on every device until something new happens. */
export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  const saved = await markNotificationsRead(session.user.id);
  if (!saved) return { ok: false as const, error: "Finish onboarding first, then this is saved." };
  revalidatePath("/settings");
  return { ok: true as const };
}
