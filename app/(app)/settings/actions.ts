"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { ACCENT_STORAGE_KEY, isStoredAccent } from "@/lib/accent";
import { auth, signOut } from "@/lib/auth";
import { invalidateAccount, invalidateCatalog, invalidateCommunity, invalidateEvents, invalidateLandingStats, invalidateMap } from "@/lib/cache/invalidate";
import { deleteAccountRecord } from "@/lib/data/account-delete";
import { clientIp, loginAllowed } from "@/lib/limits";
import { followSkillRecord, saveProfileIdentity, saveStreakReminder, unfollowSkillRecord } from "@/lib/data/settings";
import { prisma } from "@/lib/prisma";

function refreshAccount() {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/roadmap");
  revalidatePath("/clips");
  revalidatePath("/progress");
  revalidatePath("/analytics");
}

/** The display name and, when one is chosen, a new photo (an upload, a generated avatar, or none). */
export async function saveSettings(input: { name: string; photo?: unknown }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  const result = await saveProfileIdentity(session.user.id, input);
  if (result.ok) refreshAccount();
  return result;
}

/** Remember a preset or a custom gradient. The cookie paints the next page before it loads. */
export async function saveAccent(accent: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  if (!isStoredAccent(accent)) return { ok: false as const, error: "Choose a preset or a hex color." };

  await prisma.learnerProfile.updateMany({
    where: { userId: session.user.id },
    data: { accent },
  });

  const jar = await cookies();
  jar.set(ACCENT_STORAGE_KEY, accent, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return { ok: true as const };
}

export async function saveReminder(enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  const result = await saveStreakReminder(session.user.id, enabled);
  if (result.ok) revalidatePath("/settings");
  return result;
}

/** Shows or hides activity counts on the public profile. Personal, so nothing shared is expired. */
export async function saveShowActivity(enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  const updated = await prisma.learnerProfile.updateMany({ where: { userId: session.user.id }, data: { showActivity: enabled } });
  if (updated.count === 0) return { ok: false as const, error: "Finish onboarding first, then choose this." };
  revalidatePath("/settings");
  revalidatePath(`/profile/${session.user.id}`);
  return { ok: true as const };
}

/** Shows or hides the Detox Score on the public profile. Off by default; detox data is sensitive. Nothing shared is cached. */
export async function saveShowDetox(enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  const updated = await prisma.learnerProfile.updateMany({ where: { userId: session.user.id }, data: { showDetoxOnProfile: enabled } });
  if (updated.count === 0) return { ok: false as const, error: "Finish onboarding first, then choose this." };
  revalidatePath("/settings");
  revalidatePath(`/profile/${session.user.id}`);
  return { ok: true as const };
}

export async function followSkill(skillId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  const result = await followSkillRecord(session.user.id, skillId);
  if (result.ok) refreshAccount();
  return result;
}

export async function unfollowSkill(skillId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  const result = await unfollowSkillRecord(session.user.id, skillId);
  if (result.ok) refreshAccount();
  return result;
}

/** Removes the Google sign-in from this account. Refused when there is no password, so nobody locks themselves out. */
export async function disconnectGoogle() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: "Sign in again before saving." };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user?.password) {
    return { ok: false as const, error: "Google is the only way into this account. It stays connected." };
  }
  await prisma.account.deleteMany({ where: { userId, provider: "google" } });
  revalidatePath("/settings");
  return { ok: true as const };
}

/** One notification switch. The streak reminder keeps its own column; the others are new kinds of bell notes. */
export async function saveNotificationPref(kind: "streak" | "reviews" | "community" | "detox", enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  if (kind === "streak") return saveReminder(enabled);
  const data = kind === "reviews" ? { notifyReviews: enabled } : kind === "community" ? { notifyCommunity: enabled } : { notifyDetox: enabled };
  const updated = await prisma.learnerProfile.updateMany({ where: { userId: session.user.id }, data });
  if (updated.count === 0) return { ok: false as const, error: "Finish onboarding first, then choose this." };
  revalidatePath("/settings");
  return { ok: true as const };
}

/**
 * Permanently delete the signed-in account, then sign out. Password tries share the log-in limit,
 * so this form cannot be used to guess a password on an open session.
 */
export async function deleteAccount(input: { confirm: string; password: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: "Sign in again before deleting." };
  if (input.password && !(await loginAllowed(session.user.email ?? userId, clientIp(await headers())))) {
    return { ok: false as const, error: "Too many tries. Wait a few minutes, then try again." };
  }

  const result = await deleteAccountRecord(userId, { confirm: String(input.confirm ?? ""), password: String(input.password ?? "") });
  if (!result.ok) return result;

  // Shared pages that counted or showed this person.
  invalidateLandingStats();
  invalidateAccount(userId);
  if (result.touched.community) invalidateCommunity();
  if (result.touched.map) invalidateMap();
  if (result.touched.liveVideo) invalidateCatalog();
  if (result.touched.events) invalidateEvents();

  await signOut({ redirectTo: "/" });
  return { ok: true as const };
}
