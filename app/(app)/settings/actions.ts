"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { invalidateAccount } from "@/lib/cache/invalidate";
import { ACCENT_STORAGE_KEY, isStoredAccent } from "@/lib/accent";
import { auth } from "@/lib/auth";
import { followSkillRecord, saveProfileName, unfollowSkillRecord } from "@/lib/data/settings";
import { prisma } from "@/lib/prisma";

function refreshAccount() {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/roadmap");
  revalidatePath("/clips");
  revalidatePath("/progress");
  revalidatePath("/analytics");
}

export async function saveSettings(input: { name: string }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  const result = await saveProfileName(session.user.id, input.name);
  if (result.ok) {
    refreshAccount();
    invalidateAccount(session.user.id);
  }
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
