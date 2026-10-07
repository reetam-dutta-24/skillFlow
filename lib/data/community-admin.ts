import "server-only";
import { loadPublicCatalog } from "@/lib/data/public-catalog";
import { prisma } from "@/lib/prisma";

// Maintainers panel and /admin/community. Per request, behind a role check in the page. Never cached, never emails.

export type TeamMember = {
  roleId: string;
  userId: string;
  name: string | null;
  image: string | null;
  role: "REVIEWER" | "MAINTAINER";
  grantedAt: string;
  grantedBy: string | null;
  skill: { id: string; slug: string; name: string };
};

const teamSelect = {
  id: true,
  role: true,
  createdAt: true,
  user: { select: { id: true, name: true, image: true } },
  grantedBy: { select: { name: true } },
  skill: { select: { id: true, slug: true, name: true } },
} as const;

function toMember(row: {
  id: string;
  role: "REVIEWER" | "MAINTAINER";
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null };
  grantedBy: { name: string | null } | null;
  skill: { id: string; slug: string; name: string };
}): TeamMember {
  return {
    roleId: row.id,
    userId: row.user.id,
    name: row.user.name,
    image: row.user.image,
    role: row.role,
    grantedAt: row.createdAt.toISOString(),
    grantedBy: row.grantedBy?.name ?? null,
    skill: row.skill,
  };
}

/** Maintainers first, then reviewers, plus how many contributions wait in this niche. */
export async function loadNicheTeam(skillId: string) {
  const [roles, open] = await Promise.all([
    prisma.communityRole.findMany({
      where: { skillId },
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
      select: teamSelect,
    }),
    prisma.communityContribution.count({ where: { skillId, status: "OPEN" } }),
  ]);
  return { members: roles.map(toMember), open };
}

export type AdminNicheRow = {
  id: string;
  slug: string;
  name: string;
  open: number;
  oldestOpen: string | null;
  merged: number;
  reviewers: number;
  maintainers: number;
};

/**
 * Niches with community activity or roles. With a search, every niche whose name matches.
 * A fixed six queries: skills, counts by status, oldest open item, role counts, role holders, and the last 20 unmerges.
 */
export async function loadAdminCommunity(search: string) {
  const q = search.trim().slice(0, 80);
  const [skills, byStatus, oldest, roleCounts, roles, unmerges] = await Promise.all([
    prisma.skill.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.communityContribution.groupBy({ by: ["skillId", "status"], _count: { _all: true } }),
    prisma.communityContribution.groupBy({ by: ["skillId"], where: { status: "OPEN" }, _min: { createdAt: true } }),
    prisma.communityRole.groupBy({ by: ["skillId", "role"], _count: { _all: true } }),
    prisma.communityRole.findMany({
      where: q ? { skill: { name: { contains: q, mode: "insensitive" } } } : undefined,
      orderBy: [{ skill: { order: "asc" } }, { role: "desc" }, { createdAt: "asc" }],
      select: teamSelect,
    }),
    prisma.contributionReview.findMany({
      where: { unmerge: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        reason: true,
        feedback: true,
        createdAt: true,
        reviewer: { select: { name: true } },
        contribution: { select: { id: true, title: true, skill: { select: { slug: true, name: true } } } },
      },
    }),
  ]);

  const count = (skillId: string, status: string) =>
    byStatus.find((row) => row.skillId === skillId && row.status === status)?._count._all ?? 0;
  const roleCount = (skillId: string, role: string) =>
    roleCounts.find((row) => row.skillId === skillId && row.role === role)?._count._all ?? 0;
  const oldestBySkill = new Map(oldest.map((row) => [row.skillId, row._min.createdAt]));

  const niches: AdminNicheRow[] = skills
    .map((skill) => ({
      id: skill.id,
      slug: skill.slug,
      name: skill.name,
      open: count(skill.id, "OPEN"),
      oldestOpen: oldestBySkill.get(skill.id)?.toISOString() ?? null,
      merged: count(skill.id, "MERGED"),
      reviewers: roleCount(skill.id, "REVIEWER"),
      maintainers: roleCount(skill.id, "MAINTAINER"),
    }))
    .filter((row) => {
      if (q) return true;
      const activity = byStatus.some((item) => item.skillId === row.id);
      return activity || row.reviewers > 0 || row.maintainers > 0;
    });

  return {
    niches,
    roles: roles.map(toMember),
    unmerges: unmerges.map((row) => ({
      id: row.id,
      reason: row.reason,
      feedback: row.feedback,
      at: row.createdAt.toISOString(),
      by: row.reviewer?.name ?? "Former reviewer",
      contribution: row.contribution,
    })),
  };
}

/** Every niche name, for the grant form. The names are the shared catalog. Roles stay on the request. */
export async function listNicheOptions() {
  const catalog = await loadPublicCatalog();
  return catalog.map((entry) => ({ id: entry.skill.id, name: entry.skill.name }));
}
