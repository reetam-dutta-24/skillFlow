import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_LIMITS, limitMessage, limitReached } from "@/lib/services/community/limits";
import { fail } from "@/lib/services/community/result";

const HOUR_MS = 60 * 60 * 1000;

export async function toggleUseful(userId: string, contributionId: string) {
  const row = await prisma.communityContribution.findUnique({
    where: { id: contributionId },
    select: { id: true, authorId: true, status: true, usefulCount: true },
  });
  if (!row || row.status !== "MERGED") return fail("Mark a public contribution.");
  if (row.authorId === userId) return fail("You cannot mark your own contribution.");

  const existing = await prisma.usefulMark.findUnique({
    where: { userId_contributionId: { userId, contributionId } },
    select: { userId: true },
  });

  if (!existing) {
    const since = new Date(Date.now() - HOUR_MS);
    const recent = await prisma.usefulMark.count({ where: { userId, createdAt: { gte: since } } });
    if (limitReached(recent, COMMUNITY_LIMITS.usefulTogglesPerHour)) return fail(limitMessage("useful"));
  }

  try {
    const usefulCount = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.usefulMark.delete({ where: { userId_contributionId: { userId, contributionId } } });
        const updated = await tx.communityContribution.update({
          where: { id: contributionId },
          data: { usefulCount: { decrement: 1 } },
          select: { usefulCount: true },
        });
        return Math.max(0, updated.usefulCount);
      }
      await tx.usefulMark.create({ data: { userId, contributionId } });
      const updated = await tx.communityContribution.update({
        where: { id: contributionId },
        data: { usefulCount: { increment: 1 } },
        select: { usefulCount: true },
      });
      return updated.usefulCount;
    });
    return { ok: true as const, useful: !existing, usefulCount };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("That mark was just saved. Try again.");
    }
    throw error;
  }
}
