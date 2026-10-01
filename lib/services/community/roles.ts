import "server-only";
import { invalidateCommunity } from "@/lib/cache/invalidate";
import { prisma } from "@/lib/prisma";
import { communityActor } from "@/lib/services/community/actor";
import { canSeeSuggestions, isAdmin, roleChangeBlock } from "@/lib/services/community/permissions";
import { fail } from "@/lib/services/community/result";
import { emailLookupSchema, issueOf, roleSchema } from "@/lib/validators/community";

export const SUGGESTION_NOTE = "Explain-back grading isn't live yet, so few people are eligible.";

const MERGED_FOR_SUGGESTION = 3;

/** Admins grant either role anywhere. Maintainers grant reviewers in their niche. Granting a role someone holds is a no-op. */
export async function grantRole(actorId: string, raw: unknown) {
  const parsed = roleSchema.safeParse(raw);
  if (!parsed.success) return fail(issueOf(parsed.error).error, issueOf(parsed.error).field);
  const { userId, skillId, role } = parsed.data;

  const actor = await communityActor(actorId);
  if (!actor) return fail("Sign in to continue.");
  const blocked = roleChangeBlock(actor, userId, skillId, role);
  if (blocked) return fail(blocked);

  const [person, skill] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.skill.findUnique({ where: { id: skillId }, select: { id: true } }),
  ]);
  if (!person || !skill) return fail("Choose a person and a niche that exist.");

  await prisma.communityRole.upsert({
    where: { userId_skillId_role: { userId, skillId, role } },
    create: { userId, skillId, role, grantedById: actorId },
    update: {},
  });
  invalidateCommunity();
  return { ok: true as const };
}

export async function revokeRole(actorId: string, raw: unknown) {
  const parsed = roleSchema.safeParse(raw);
  if (!parsed.success) return fail(issueOf(parsed.error).error, issueOf(parsed.error).field);
  const { userId, skillId, role } = parsed.data;

  const actor = await communityActor(actorId);
  if (!actor) return fail("Sign in to continue.");
  const blocked = roleChangeBlock(actor, userId, skillId, role);
  if (blocked) return fail(blocked);

  await prisma.communityRole.deleteMany({ where: { userId, skillId, role } });
  invalidateCommunity();
  return { ok: true as const };
}

export type SuggestedPerson = { id: string; name: string | null; image: string | null; merged: number };

/**
 * Two groups for one niche, never including people who already review or maintain it.
 * Eligible: 3 merged here, and a full pass (quiz and explain-back) on every stage when the niche has stages.
 * Strong contributors: 3 merged here, path not completed. Nobody is granted automatically.
 * Five queries, whatever the niche size.
 */
export async function suggestedReviewers(actorId: string, skillId: string) {
  const actor = await communityActor(actorId);
  if (!actor || !canSeeSuggestions(actor, skillId)) return fail("You cannot see suggested reviewers for this niche.");

  const [skill, grouped, holders] = await Promise.all([
    prisma.skill.findUnique({ where: { id: skillId }, select: { stages: { select: { id: true } } } }),
    prisma.communityContribution.groupBy({
      by: ["authorId"],
      where: { skillId, status: "MERGED", authorId: { not: null } },
      _count: { _all: true },
    }),
    prisma.communityRole.findMany({ where: { skillId }, select: { userId: true } }),
  ]);
  if (!skill) return fail("Choose a niche that exists.");

  const held = new Set(holders.map((row) => row.userId));
  const merged = new Map<string, number>();
  for (const row of grouped) {
    if (row.authorId && row._count._all >= MERGED_FOR_SUGGESTION && !held.has(row.authorId)) {
      merged.set(row.authorId, row._count._all);
    }
  }
  const ids = [...merged.keys()];
  if (ids.length === 0) return { ok: true as const, eligible: [] as SuggestedPerson[], strong: [] as SuggestedPerson[], note: SUGGESTION_NOTE };

  const stageIds = skill.stages.map((stage) => stage.id);
  const [completed, people] = await Promise.all([
    fullPasses(ids, stageIds),
    prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, image: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const eligible: SuggestedPerson[] = [];
  const strong: SuggestedPerson[] = [];
  for (const person of people) {
    const entry = { ...person, merged: merged.get(person.id) ?? 0 };
    if (stageIds.length === 0 || completed.has(person.id)) eligible.push(entry);
    else strong.push(entry);
  }
  return { ok: true as const, eligible, strong, note: SUGGESTION_NOTE };
}

/** People who passed the quiz and the explain-back on every one of these stages. */
async function fullPasses(userIds: string[], stageIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0 || stageIds.length === 0) return new Set();
  const rows = await prisma.stageCompletion.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds }, stageId: { in: stageIds }, quizPassed: true, explainBackPassed: true },
    _count: { _all: true },
  });
  return new Set(rows.flatMap((row) => (row._count._all >= stageIds.length ? [row.userId] : [])));
}

/** Admin only. Finds one person by exact email so a role can be granted. Returns name and avatar, never the email. */
export async function findPersonByEmail(actorId: string, raw: unknown) {
  const actor = await communityActor(actorId);
  if (!actor || !isAdmin(actor)) return fail("Only an admin can look people up.");
  const parsed = emailLookupSchema.safeParse(raw);
  if (!parsed.success) return fail(issueOf(parsed.error).error, "email");

  const person = await prisma.user.findFirst({
    where: { email: { equals: parsed.data, mode: "insensitive" } },
    select: { id: true, name: true, image: true },
  });
  if (!person) return fail("Nobody has that email address.", "email");
  return { ok: true as const, person };
}
