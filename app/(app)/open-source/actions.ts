"use server";

import { auth } from "@/lib/auth";
import { joinCommunity, leaveCommunity } from "@/lib/services/community/memberships";
import { toggleUseful } from "@/lib/services/community/useful";

async function signedInId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function joinCommunityAction(formData: FormData) {
  const userId = await signedInId();
  const skillId = String(formData.get("skillId") ?? "");
  if (!userId || !skillId) return;
  await joinCommunity(userId, skillId);
}

export async function leaveCommunityAction(formData: FormData) {
  const userId = await signedInId();
  const skillId = String(formData.get("skillId") ?? "");
  if (!userId || !skillId) return;
  await leaveCommunity(userId, skillId);
}

export async function toggleUsefulAction(contributionId: string) {
  const userId = await signedInId();
  if (!userId) return { ok: false as const, error: "Sign in to continue." };
  return toggleUseful(userId, contributionId);
}
