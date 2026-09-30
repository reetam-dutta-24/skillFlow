import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { communityActor } from "@/lib/services/community/actor";
import { canGrantMaintainer, canGrantReviewer, canSeeSuggestions } from "@/lib/services/community/permissions";
import { fail } from "@/lib/services/community/result";

export async function grantRole(actorId: string, userId: string, skillId: string, role: "REVIEWER" | "MAINTAINER") {
  const actor = await communityActor(actorId);
  if (!actor) return fail("Sign in to continue.");
  if (role === "MAINTAINER" && !canGrantMaintainer(actor)) return fail("An admin grants maintainers.");
  if (role === "REVIEWER" && !canGrantReviewer(actor, skillId)) return fail("You cannot grant reviewers in this niche.");

  const person = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  const skill = await prisma.skill.findUnique({ where: { id: skillId }, select: { id: true } });
  if (!person || !skill) return fail("Choose a person and a niche that exist.");

  try {
    await prisma.communityRole.create({ data: { userId, skillId, role, grantedById: actorId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("That person already has this role.");
    }
    throw error;
  }
  return { ok: true as const };
}

export async function revokeRole(actorId: string, userId: string, skillId: string, role: "REVIEWER" | "MAINTAINER") {
  const actor = await communityActor(actorId);
  if (!actor) return fail("Sign in to continue.");
  if (role === "MAINTAINER" && !canGrantMaintainer(actor)) return fail("An admin revokes maintainers.");
  if (role === "REVIEWER" && !canGrantReviewer(actor, skillId)) return fail("You cannot change reviewers in this niche.");

  await prisma.communityRole.deleteMany({ where: { userId, skillId, role } });
  return { ok: true as const };
}

/** People with 3 merged contributions here, and a full pass on every stage when the path is open. Nobody is granted automatically. */
export async function suggestedReviewers(actorId: string, skillId: string) {
  const actor = await communityActor(actorId);
  if (!actor || !canSeeSuggestions(actor, skillId)) return fail("You cannot see suggested reviewers for this niche.");

  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: { status: true, stages: { select: { id: true } } },
  });
  if (!skill) return fail("Choose a niche that exists.");

  const grouped = await prisma.communityContribution.groupBy({
    by: ["authorId"],
    where: { skillId, status: "MERGED", authorId: { not: null } },
    _count: { _all: true },
  });
  let ids = grouped.flatMap((row) => (row.authorId && row._count._all >= 3 ? [row.authorId] : []));

  if (skill.status === "AVAILABLE" && skill.stages.length > 0 && ids.length > 0) {
    const stageIds = skill.stages.map((stage) => stage.id);
    const completions = await prisma.stageCompletion.findMany({
      where: { userId: { in: ids }, stageId: { in: stageIds }, quizPassed: true, explainBackPassed: true },
      select: { userId: true, stageId: true },
    });
    const passed = new Map<string, Set<string>>();
    for (const row of completions) {
      const set = passed.get(row.userId) ?? new Set<string>();
      set.add(row.stageId);
      passed.set(row.userId, set);
    }
    ids = ids.filter((id) => passed.get(id)?.size === stageIds.length);
  }

  const people = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, image: true },
    orderBy: { name: "asc" },
  });
  return { ok: true as const, people };
}
