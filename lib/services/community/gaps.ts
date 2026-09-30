import "server-only";
import { invalidateCommunity } from "@/lib/cache/invalidate";
import { prisma } from "@/lib/prisma";
import { communityActor } from "@/lib/services/community/actor";
import { COMMUNITY_LIMITS, limitMessage, limitReached } from "@/lib/services/community/limits";
import { canModerate } from "@/lib/services/community/permissions";
import { fail } from "@/lib/services/community/result";
import { gapSchema, issueOf } from "@/lib/validators/community";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function reportGap(userId: string, raw: unknown) {
  const parsed = gapSchema.safeParse(raw);
  if (!parsed.success) return fail(issueOf(parsed.error).error, issueOf(parsed.error).field);
  const input = parsed.data;

  const since = new Date(Date.now() - DAY_MS);
  const recent = await prisma.gapReport.count({ where: { authorId: userId, createdAt: { gte: since } } });
  if (limitReached(recent, COMMUNITY_LIMITS.gapsPerDay)) return fail(limitMessage("gaps"));

  const skill = await prisma.skill.findUnique({ where: { id: input.skillId }, select: { id: true, status: true } });
  if (!skill) return fail("Choose a niche that exists.", "skillId");
  if (input.stageId) {
    if (skill.status !== "AVAILABLE") return fail("Stages are only for an open path.", "stageId");
    const stage = await prisma.roadmapStage.findFirst({
      where: { id: input.stageId, skillId: input.skillId },
      select: { id: true },
    });
    if (!stage) return fail("That stage is not part of this niche.", "stageId");
  }

  const row = await prisma.gapReport.create({
    data: {
      skillId: input.skillId,
      stageId: input.stageId ?? null,
      authorId: userId,
      title: input.title,
      description: input.description,
    },
    select: { id: true },
  });
  invalidateCommunity();
  return { ok: true as const, id: row.id };
}

export async function setGapGoodFirst(userId: string, gapId: string, goodFirst: boolean) {
  const actor = await communityActor(userId);
  if (!actor) return fail("Sign in to continue.");
  const gap = await prisma.gapReport.findUnique({ where: { id: gapId }, select: { id: true, skillId: true, status: true } });
  if (!gap) return fail("That gap is not here.");
  if (!canModerate(actor, gap.skillId)) return fail("You cannot label gaps in this niche.");
  if (gap.status !== "OPEN") return fail("Label an open gap.");
  await prisma.gapReport.update({ where: { id: gap.id }, data: { goodFirst } });
  invalidateCommunity();
  return { ok: true as const };
}

export async function closeGap(userId: string, gapId: string) {
  const actor = await communityActor(userId);
  if (!actor) return fail("Sign in to continue.");
  const gap = await prisma.gapReport.findUnique({ where: { id: gapId }, select: { id: true, skillId: true, status: true } });
  if (!gap) return fail("That gap is not here.");
  if (!canModerate(actor, gap.skillId)) return fail("You cannot close gaps in this niche.");
  if (gap.status === "RESOLVED") return fail("That gap was resolved by a contribution.");
  await prisma.gapReport.update({ where: { id: gap.id }, data: { status: "CLOSED" } });
  invalidateCommunity();
  return { ok: true as const };
}
