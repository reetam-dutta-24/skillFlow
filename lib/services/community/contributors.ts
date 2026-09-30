import "server-only";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Public contributor page. Name and avatar only. Email stays off this page. */
export async function contributorProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      communityRoles: { select: { role: true, skill: { select: { slug: true, name: true } } } },
    },
  });
  if (!user) return null;

  const since = new Date(Date.now() - 366 * DAY_MS);
  const merged = await prisma.communityContribution.findMany({
    where: { authorId: userId, status: "MERGED", mergedAt: { not: null } },
    select: {
      id: true,
      title: true,
      type: true,
      mergedAt: true,
      skill: { select: { slug: true, name: true } },
    },
    orderBy: { mergedAt: "desc" },
  });

  const byNiche = new Map<string, { slug: string; name: string; contributions: { id: string; title: string; type: string; mergedAt: string }[] }>();
  const heatmap = new Map<string, number>();
  for (const row of merged) {
    if (!row.mergedAt) continue;
    const niche = byNiche.get(row.skill.slug) ?? { slug: row.skill.slug, name: row.skill.name, contributions: [] };
    niche.contributions.push({ id: row.id, title: row.title, type: row.type, mergedAt: row.mergedAt.toISOString() });
    byNiche.set(row.skill.slug, niche);
    if (row.mergedAt >= since) {
      const key = dayKey(row.mergedAt);
      heatmap.set(key, (heatmap.get(key) ?? 0) + 1);
    }
  }

  return {
    id: user.id,
    name: user.name,
    image: user.image,
    contributor: merged.length > 0,
    mergedCount: merged.length,
    roles: user.communityRoles.map((role) => ({ role: role.role, slug: role.skill.slug, name: role.skill.name })),
    niches: [...byNiche.values()],
    heatmap: [...heatmap.entries()].map(([day, count]) => ({ day, count })),
  };
}

/** Top merged authors in one niche, plus reviewers and maintainers. */
export async function nicheContributors(skillId: string) {
  const [grouped, roles] = await Promise.all([
    prisma.communityContribution.groupBy({
      by: ["authorId"],
      where: { skillId, status: "MERGED", authorId: { not: null } },
      _count: { _all: true },
    }),
    prisma.communityRole.findMany({
      where: { skillId },
      select: { role: true, user: { select: { id: true, name: true, image: true } } },
    }),
  ]);

  const ranked = grouped
    .flatMap((row) => (row.authorId ? [{ id: row.authorId, merged: row._count._all }] : []))
    .sort((a, b) => b.merged - a.merged)
    .slice(0, 20);
  const people = await prisma.user.findMany({
    where: { id: { in: ranked.map((row) => row.id) } },
    select: { id: true, name: true, image: true },
  });
  const byId = new Map(people.map((person) => [person.id, person]));

  return {
    top: ranked.flatMap((row) => {
      const person = byId.get(row.id);
      return person ? [{ id: person.id, name: person.name, image: person.image, merged: row.merged }] : [];
    }),
    roles: roles.map((role) => ({
      role: role.role,
      id: role.user.id,
      name: role.user.name,
      image: role.user.image,
    })),
  };
}
