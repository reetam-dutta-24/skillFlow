import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Strikes for answers that read as AI-written or pasted, per learner per stage (`ExplainBackIntegrity`). Counts only:
 * the flagged text is never stored here. Personal and read on the request; nothing here is cached.
 */

export async function stageStrikes(userId: string, stageId: string): Promise<number> {
  const row = await prisma.explainBackIntegrity.findUnique({
    where: { userId_stageId: { userId, stageId } },
    select: { strikes: true },
  });
  return row?.strikes ?? 0;
}

/** Adds one strike and returns the new total. An atomic increment, so two quick answers cannot both read the old count. */
export async function addStrike(userId: string, stageId: string): Promise<number> {
  const row = await prisma.explainBackIntegrity.upsert({
    where: { userId_stageId: { userId, stageId } },
    create: { userId, stageId, strikes: 1, lastFlaggedAt: new Date() },
    update: { strikes: { increment: 1 }, lastFlaggedAt: new Date() },
    select: { strikes: true },
  });
  return row.strikes;
}
