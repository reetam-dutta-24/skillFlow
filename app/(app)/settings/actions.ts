"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { followSkillRecord, saveProfileName, unfollowSkillRecord } from "@/lib/data/settings";

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
  if (result.ok) refreshAccount();
  return result;
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
