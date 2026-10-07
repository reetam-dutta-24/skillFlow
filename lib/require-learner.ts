import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSkillSlug, skillBySlug } from "@/lib/learner";
import { prisma } from "@/lib/prisma";

/** Signed-in learner with a saved profile. Sends everyone else to login or onboarding. */
export async function requireLearner() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.learnerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/onboarding");

  if (!isSkillSlug(profile.skillSlug)) redirect("/onboarding?edit=1");
  const choice = skillBySlug(profile.skillSlug);

  const progress = await prisma.userSkillProgress.findFirst({
    where: { userId: session.user.id, skill: { slug: profile.skillSlug } },
    select: { currentStageOrder: true },
  });

  return { session, profile, choice, progress };
}
