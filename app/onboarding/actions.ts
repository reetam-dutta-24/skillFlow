"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { ACCENT_STORAGE_KEY, isStoredAccent } from "@/lib/accent";
import { saveProfileIdentity } from "@/lib/data/settings";
import { isPaceId } from "@/lib/learner";
import { isFreePath } from "@/lib/niches/tiers";
import { MAX_HEADLINE, onboardingProblem, type OnboardingAnswers } from "@/lib/onboarding-options";
import { prisma } from "@/lib/prisma";
import { displayNameProblem } from "@/lib/profile-identity";

/**
 * Saves the onboarding profile and follows every chosen path. Personal data, so nothing here touches
 * the catalog cache. The city is saved separately through the Settings action, which owns the map cache.
 * The display name and photo go through the same save as Settings, which drops the caches that show them.
 */
export async function saveLearnerProfile(input: OnboardingAnswers & { name: string; photo?: unknown }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to continue." };
  const nameProblem = displayNameProblem(String(input.name ?? ""));
  if (nameProblem) return { error: nameProblem };

  const answers: OnboardingAnswers = {
    ...input,
    headline: String(input.headline ?? "").trim().slice(0, MAX_HEADLINE + 1),
    paths: [...new Set(input.paths ?? [])],
    goals: [...new Set(input.goals ?? [])],
    formats: [...new Set(input.formats ?? [])],
    languages: [...new Set(input.languages ?? [])],
    guardianConsent: input.guardianConsent === true,
  };
  const problem = onboardingProblem(answers, isFreePath);
  if (problem) return { error: problem };
  if (!isPaceId(answers.pace)) return { error: "Choose a pace." };
  if (!isStoredAccent(answers.accent)) return { error: "Choose a color." };

  const userId = session.user.id;
  const profile = {
    // The first path and goal keep the older single-value fields filled for Home and the roadmap.
    skillSlug: answers.paths[0],
    goal: answers.goals[0],
    pace: answers.pace,
    accent: answers.accent,
    ageRange: answers.ageRange,
    guardianConsent: answers.ageRange === "13-17" ? answers.guardianConsent : false,
    stage: answers.stage,
    experience: answers.experience,
    weeklyHours: answers.weeklyHours,
    goals: answers.goals,
    languages: answers.languages,
    formats: answers.formats,
    headline: answers.headline || null,
  };

  const skills = await prisma.skill.findMany({
    where: { slug: { in: answers.paths }, status: "AVAILABLE" },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.learnerProfile.upsert({ where: { userId }, create: { userId, ...profile }, update: profile }),
    // Following is the UserSkillProgress row. Paths left out here are not unfollowed; Niches does that.
    ...skills.map((skill) =>
      prisma.userSkillProgress.upsert({
        where: { userId_skillId: { userId, skillId: skill.id } },
        create: { userId, skillId: skill.id },
        update: {},
      }),
    ),
  ]);

  const identity = await saveProfileIdentity(userId, { name: String(input.name), photo: input.photo });
  if (!identity.ok) return { error: identity.error };

  const jar = await cookies();
  jar.set(ACCENT_STORAGE_KEY, answers.accent, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return { ok: true as const };
}
