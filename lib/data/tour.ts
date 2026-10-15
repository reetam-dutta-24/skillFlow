import "server-only";
import { prisma } from "@/lib/prisma";
import { PLACEHOLDER_PROFILE } from "@/lib/data/settings";

/** When this learner finished or skipped the Home tour. Personal, so it is read on the request, never cached. */
export async function loadTourCompletedAt(userId: string) {
  const profile = await prisma.learnerProfile.findUnique({ where: { userId }, select: { tourCompletedAt: true } });
  return profile?.tourCompletedAt ?? null;
}

/**
 * Marks the tour finished or skipped. A learner who reached Home without onboarding has no profile yet, so it is
 * created with the same placeholders a saved city uses; onboarding still opens for them.
 */
export async function saveTourCompleted(userId: string, now = new Date()) {
  await prisma.learnerProfile.upsert({
    where: { userId },
    create: { userId, ...PLACEHOLDER_PROFILE, tourCompletedAt: now },
    update: { tourCompletedAt: now },
  });
}
