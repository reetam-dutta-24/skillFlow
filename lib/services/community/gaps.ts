import "server-only";
import { invalidateCommunity } from "@/lib/cache/invalidate";
import { prisma } from "@/lib/prisma";
import { communityActor } from "@/lib/services/community/actor";
import { COMMUNITY_LIMITS, limitMessage, limitReached } from "@/lib/services/community/limits";
import { canModerate } from "@/lib/services/community/permissions";
import { fail } from "@/lib/services/community/result";
import { gapModerationSchema, gapSchema, issueOf } from "@/lib/validators/community";

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

const GAP_MOVES = {
  goodFirst: { from: "OPEN", data: { goodFirst: true }, error: "Label an open gap." },
  notGoodFirst: { from: "OPEN", data: { goodFirst: false }, error: "Label an open gap." },
  close: { from: "OPEN", data: { status: "CLOSED" }, error: "Close an open gap." },
  reopen: { from: "CLOSED", data: { status: "OPEN" }, error: "Reopen a closed gap." },
} as const;

/** Maintainers and admins: label good-first, close an open gap, or reopen a closed one. A resolved gap only changes through its contribution. */
export async function moderateGap(userId: string, raw: unknown) {
  const parsed = gapModerationSchema.safeParse(raw);
  if (!parsed.success) return fail(issueOf(parsed.error).error);
  const { gapId, op } = parsed.data;

  const actor = await communityActor(userId);
  if (!actor) return fail("Sign in to continue.");
  const gap = await prisma.gapReport.findUnique({ where: { id: gapId }, select: { id: true, skillId: true, status: true } });
  if (!gap) return fail("That gap is not here.");
  if (!canModerate(actor, gap.skillId)) return fail("You cannot change gaps in this niche.");

  const move = GAP_MOVES[op];
  if (gap.status !== move.from) return fail(move.error);
  const changed = await prisma.gapReport.updateMany({ where: { id: gap.id, status: move.from }, data: move.data });
  if (changed.count === 0) return fail("That gap changed since you opened it. Reload to see the latest version.");
  invalidateCommunity();
  return { ok: true as const };
}
