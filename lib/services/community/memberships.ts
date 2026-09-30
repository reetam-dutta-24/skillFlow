import "server-only";
import { invalidateCommunity } from "@/lib/cache/invalidate";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/services/community/result";

export async function joinCommunity(userId: string, skillId: string) {
  const skill = await prisma.skill.findUnique({ where: { id: skillId }, select: { id: true } });
  if (!skill) return fail("Choose a niche that exists.");
  await prisma.communityMembership.upsert({
    where: { userId_skillId: { userId, skillId } },
    create: { userId, skillId },
    update: {},
  });
  invalidateCommunity();
  return { ok: true as const, joined: true as const };
}

export async function leaveCommunity(userId: string, skillId: string) {
  await prisma.communityMembership.deleteMany({ where: { userId, skillId } });
  invalidateCommunity();
  return { ok: true as const, joined: false as const };
}

/** New merged contributions and resolved gaps since the member last opened this niche. */
export async function communityNews(userId: string, skillId: string) {
  const membership = await prisma.communityMembership.findUnique({
    where: { userId_skillId: { userId, skillId } },
    select: { lastSeenAt: true },
  });
  if (!membership) return { joined: false as const, count: 0 };

  const [contributions, gaps] = await Promise.all([
    prisma.communityContribution.count({
      where: { skillId, status: "MERGED", mergedAt: { gt: membership.lastSeenAt } },
    }),
    prisma.gapReport.count({
      where: { skillId, status: "RESOLVED", updatedAt: { gt: membership.lastSeenAt } },
    }),
  ]);
  return { joined: true as const, count: contributions + gaps };
}

export async function markCommunitySeen(userId: string, skillId: string) {
  await prisma.communityMembership.updateMany({
    where: { userId, skillId },
    data: { lastSeenAt: new Date() },
  });
}
