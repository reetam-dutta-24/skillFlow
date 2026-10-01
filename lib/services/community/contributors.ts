import "server-only";
import { buildHeatmap, dayKey, type Heatmap } from "@/lib/community-heatmap";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ContributorNiche = {
  slug: string;
  name: string;
  contributions: { id: string; title: string; type: string; mergedAt: string }[];
};

export type ContributorProfile = {
  id: string;
  name: string | null;
  image: string | null;
  contributor: boolean;
  mergedCount: number;
  roles: { role: "REVIEWER" | "MAINTAINER"; slug: string; name: string }[];
  niches: ContributorNiche[];
  heatmap: Heatmap;
};

/** Public contributor section. Merged work only. Name and avatar, never email. */
export async function contributorProfile(userId: string): Promise<ContributorProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      communityRoles: {
        orderBy: { createdAt: "asc" },
        select: { role: true, skill: { select: { slug: true, name: true } } },
      },
      communityContributions: {
        where: { status: "MERGED", mergedAt: { not: null } },
        orderBy: { mergedAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          mergedAt: true,
          skill: { select: { slug: true, name: true } },
        },
      },
    },
  });
  if (!user) return null;

  const now = new Date();
  const since = new Date(now.getTime() - 366 * DAY_MS);
  const byNiche = new Map<string, ContributorNiche>();
  const perDay = new Map<string, number>();
  for (const row of user.communityContributions) {
    if (!row.mergedAt) continue;
    const niche = byNiche.get(row.skill.slug) ?? { slug: row.skill.slug, name: row.skill.name, contributions: [] };
    niche.contributions.push({ id: row.id, title: row.title, type: row.type, mergedAt: row.mergedAt.toISOString() });
    byNiche.set(row.skill.slug, niche);
    if (row.mergedAt >= since) {
      const key = dayKey(row.mergedAt);
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }
  }

  return {
    id: user.id,
    name: user.name,
    image: user.image,
    contributor: user.communityContributions.length > 0,
    mergedCount: user.communityContributions.length,
    roles: user.communityRoles.map((role) => ({ role: role.role, slug: role.skill.slug, name: role.skill.name })),
    niches: [...byNiche.values()],
    heatmap: buildHeatmap(perDay, now),
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
