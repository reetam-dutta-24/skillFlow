"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { ACCENT_STORAGE_KEY, isStoredAccent } from "@/lib/accent";
import { isGoalId, isPaceId, isSkillSlug } from "@/lib/learner";
import { prisma } from "@/lib/prisma";

export async function saveLearnerProfile(input: {
  skillSlug: string;
  pace: string;
  goal: string;
  accent: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to continue." };

  if (!isSkillSlug(input.skillSlug) || !isPaceId(input.pace) || !isGoalId(input.goal) || !isStoredAccent(input.accent)) {
    return { error: "Choose a skill, a pace, and a goal to continue." };
  }

  const userId = session.user.id;
  const skill = await prisma.skill.findUnique({ where: { slug: input.skillSlug } });

  await prisma.learnerProfile.upsert({
    where: { userId },
    create: {
      userId,
      skillSlug: input.skillSlug,
      pace: input.pace,
      goal: input.goal,
      accent: input.accent,
    },
    update: {
      skillSlug: input.skillSlug,
      pace: input.pace,
      goal: input.goal,
      accent: input.accent,
    },
  });

  if (skill) {
    await prisma.userSkillProgress.upsert({
      where: { userId_skillId: { userId, skillId: skill.id } },
      create: { userId, skillId: skill.id },
      update: {},
    });
  }

  const jar = await cookies();
  jar.set(ACCENT_STORAGE_KEY, input.accent, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return { ok: true as const, preferencesHref: skill && skill.status === "AVAILABLE" ? `/roadmap/${skill.slug}/preferences` : null };
}
