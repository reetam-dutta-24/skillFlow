import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { Prisma, type ContributionType, type Disclosure } from "@prisma/client";
import { COMMUNITY_TAG } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { nicheChangelog, type ChangelogWeek } from "@/lib/services/community/changelog";
import { contributorProfile, nicheContributors, type ContributorProfile } from "@/lib/services/community/contributors";

export const MERGED_PAGE_SIZE = 12;

export type CommunityNiche = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string | null;
  status: "available" | "coming_soon";
  members: number;
  merged: number;
  openGaps: number;
};

export type MergedCard = {
  id: string;
  type: ContributionType;
  title: string;
  summary: string;
  imageUrl: string | null;
  tags: string[];
  disclosure: Disclosure;
  usefulCount: number;
  createdAt: string;
  mergedAt: string | null;
  author: { id: string; name: string | null; image: string | null } | null;
  stage: { order: number; title: string } | null;
};

export type FeedCard = MergedCard & { skill: { slug: string; name: string; image: string | null } };

export type MergedQuery = {
  skillId: string;
  type: string;
  stageId: string;
  tag: string;
  sort: string;
  cursor: string;
};

export type PublicGap = {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
  goodFirst: boolean;
  createdAt: string;
  stage: { order: number; title: string } | null;
  /** The merged contribution that resolved it. */
  resolvedBy: { id: string; title: string } | null;
};

const TYPES = new Set<string>(["RESOURCE", "CONCEPT_NOTE", "LEARNING_PATH", "FOLLOW"]);

function countMap(rows: { skillId: string; _count: { _all: number } }[]) {
  return new Map(rows.map((row) => [row.skillId, row._count._all]));
}

/** Every niche with public community counts. Same list for every signed-in learner. */
export async function loadCommunityNiches(): Promise<CommunityNiche[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(COMMUNITY_TAG);

  const [skills, members, merged, gaps] = await Promise.all([
    prisma.skill.findMany({
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true, description: true, image: true, status: true },
    }),
    prisma.communityMembership.groupBy({ by: ["skillId"], _count: { _all: true } }),
    prisma.communityContribution.groupBy({
      by: ["skillId"],
      where: { status: "MERGED" },
      _count: { _all: true },
    }),
    prisma.gapReport.groupBy({
      by: ["skillId"],
      where: { status: "OPEN" },
      _count: { _all: true },
    }),
  ]);

  const memberCount = countMap(members);
  const mergedCount = countMap(merged);
  const gapCount = countMap(gaps);

  return skills.map((skill) => ({
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description ?? "",
    image: skill.image,
    status: skill.status === "AVAILABLE" ? "available" : "coming_soon",
    members: memberCount.get(skill.id) ?? 0,
    merged: mergedCount.get(skill.id) ?? 0,
    openGaps: gapCount.get(skill.id) ?? 0,
  }));
}

/** `oldest` is the review queue. The other two are the public lists. */
export type CursorSort = "newest" | "useful" | "oldest";

export function encodeCursor(sort: CursorSort, row: { id: string; createdAt: Date; usefulCount?: number }) {
  if (sort === "useful") return `u.${row.usefulCount ?? 0}.${row.id}`;
  if (sort === "oldest") return `o.${row.createdAt.getTime()}.${row.id}`;
  return `n.${row.createdAt.getTime()}.${row.id}`;
}

export function decodeCursor(sort: CursorSort, cursor: string) {
  if (!cursor) return null;
  const [kind, raw, ...rest] = cursor.split(".");
  const id = rest.join(".");
  if (!id) return null;
  if (sort === "useful" && kind === "u") {
    const usefulCount = Number(raw);
    if (!Number.isInteger(usefulCount)) return null;
    return { usefulCount, id };
  }
  if ((sort === "newest" && kind === "n") || (sort === "oldest" && kind === "o")) {
    const time = Number(raw);
    if (!Number.isFinite(time)) return null;
    return { createdAt: new Date(time), id };
  }
  return null;
}

/** Public merged contributions for one niche. Filters and the cursor are the cache key. */
export async function loadMergedPage(query: MergedQuery): Promise<{ items: MergedCard[]; nextCursor: string | null }> {
  "use cache";
  cacheLife("hours");
  cacheTag(COMMUNITY_TAG);

  const sort = query.sort === "useful" ? "useful" : "newest";
  const type = TYPES.has(query.type) ? (query.type as ContributionType) : undefined;
  const tag = query.tag.trim().toLowerCase().slice(0, 24);
  const cursor = decodeCursor(sort, query.cursor);
  const where: Prisma.CommunityContributionWhereInput = {
    skillId: query.skillId,
    status: "MERGED",
    ...(type ? { type } : {}),
    ...(query.stageId ? { stageId: query.stageId } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
  };

  if (cursor && "createdAt" in cursor) {
    where.AND = [
      {
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { lt: cursor.id } },
        ],
      },
    ];
  }
  if (cursor && "usefulCount" in cursor) {
    where.AND = [
      {
        OR: [
          { usefulCount: { lt: cursor.usefulCount } },
          { usefulCount: cursor.usefulCount, id: { lt: cursor.id } },
        ],
      },
    ];
  }

  const rows = await prisma.communityContribution.findMany({
    where,
    orderBy: sort === "useful" ? [{ usefulCount: "desc" }, { id: "desc" }] : [{ createdAt: "desc" }, { id: "desc" }],
    take: MERGED_PAGE_SIZE + 1,
    select: {
      id: true,
      type: true,
      title: true,
      summary: true,
      imageUrl: true,
      tags: true,
      disclosure: true,
      usefulCount: true,
      createdAt: true,
      mergedAt: true,
      author: { select: { id: true, name: true, image: true } },
      stage: { select: { order: true, title: true } },
    },
  });

  const page = rows.slice(0, MERGED_PAGE_SIZE);
  const last = page[page.length - 1];
  return {
    items: page.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      summary: row.summary,
      imageUrl: row.imageUrl,
      tags: row.tags,
      disclosure: row.disclosure,
      usefulCount: row.usefulCount,
      createdAt: row.createdAt.toISOString(),
      mergedAt: row.mergedAt ? row.mergedAt.toISOString() : null,
      author: row.author,
      stage: row.stage,
    })),
    nextCursor: rows.length > MERGED_PAGE_SIZE && last ? encodeCursor(sort, last) : null,
  };
}

/** Public merged contributions across the niches in view. The skill id list is part of the cache key. */
export async function loadMergedFeed(query: { skillIds: string; sort: string; cursor: string; type: string }): Promise<{ items: FeedCard[]; nextCursor: string | null }> {
  "use cache";
  cacheLife("hours");
  cacheTag(COMMUNITY_TAG);

  const ids = [...new Set(query.skillIds.split(",").map((id) => id.trim()).filter(Boolean))].sort();
  if (ids.length === 0) return { items: [], nextCursor: null };

  const sort = query.sort === "useful" ? "useful" : "newest";
  const type = TYPES.has(query.type) ? (query.type as ContributionType) : undefined;
  const cursor = decodeCursor(sort, query.cursor);
  const where: Prisma.CommunityContributionWhereInput = {
    skillId: { in: ids },
    status: "MERGED",
    ...(type ? { type } : {}),
  };

  if (cursor && "createdAt" in cursor) {
    where.AND = [{ OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] }];
  }
  if (cursor && "usefulCount" in cursor) {
    where.AND = [{ OR: [{ usefulCount: { lt: cursor.usefulCount } }, { usefulCount: cursor.usefulCount, id: { lt: cursor.id } }] }];
  }

  const rows = await prisma.communityContribution.findMany({
    where,
    orderBy: sort === "useful" ? [{ usefulCount: "desc" }, { id: "desc" }] : [{ createdAt: "desc" }, { id: "desc" }],
    take: MERGED_PAGE_SIZE + 1,
    select: {
      id: true,
      type: true,
      title: true,
      summary: true,
      tags: true,
      disclosure: true,
      usefulCount: true,
      imageUrl: true,
      createdAt: true,
      mergedAt: true,
      author: { select: { id: true, name: true, image: true } },
      stage: { select: { order: true, title: true } },
      skill: { select: { slug: true, name: true, image: true } },
    },
  });

  const page = rows.slice(0, MERGED_PAGE_SIZE);
  const last = page[page.length - 1];
  return {
    items: page.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      summary: row.summary,
      imageUrl: row.imageUrl,
      tags: row.tags,
      disclosure: row.disclosure,
      usefulCount: row.usefulCount,
      createdAt: row.createdAt.toISOString(),
      mergedAt: row.mergedAt ? row.mergedAt.toISOString() : null,
      author: row.author,
      stage: row.stage,
      skill: row.skill,
    })),
    nextCursor: rows.length > MERGED_PAGE_SIZE && last ? encodeCursor(sort, last) : null,
  };
}

/** Open gaps first (good-first ahead), then resolved, then closed. Newest first inside each group. */
export async function loadCommunityGaps(skillId: string): Promise<PublicGap[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(COMMUNITY_TAG);

  const rows = await prisma.gapReport.findMany({
    where: { skillId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      goodFirst: true,
      createdAt: true,
      stage: { select: { order: true, title: true } },
      resolvedBy: { select: { id: true, title: true, status: true } },
    },
  });

  const rank = (status: string, goodFirst: boolean) => (status === "OPEN" ? (goodFirst ? 0 : 1) : status === "RESOLVED" ? 2 : 3);
  return rows
    .sort((a, b) => rank(a.status, a.goodFirst) - rank(b.status, b.goodFirst) || b.createdAt.getTime() - a.createdAt.getTime())
    .map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      goodFirst: row.goodFirst,
      createdAt: row.createdAt.toISOString(),
      stage: row.stage,
      resolvedBy: row.resolvedBy && row.resolvedBy.status === "MERGED" ? { id: row.resolvedBy.id, title: row.resolvedBy.title } : null,
    }));
}

export async function loadCommunityChangelog(skillId: string): Promise<ChangelogWeek[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(COMMUNITY_TAG);
  return nicheChangelog(skillId);
}

export async function loadCommunityContributors(skillId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(COMMUNITY_TAG);
  return nicheContributors(skillId);
}

/** Open Source section of a public profile. Merged work only, the same for every visitor. */
export async function loadContributorProfile(userId: string): Promise<ContributorProfile | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(COMMUNITY_TAG);
  return contributorProfile(userId);
}

/** Skills this person follows. Stays on the request. */
export async function myFollowedSkillIds(userId: string) {
  const rows = await prisma.userSkillProgress.findMany({
    where: { userId },
    select: { skillId: true },
  });
  return rows.map((row) => row.skillId);
}

/** Joined niches and how many public changes arrived since each one was last opened. */
export async function myCommunityNews(userId: string) {
  const memberships = await prisma.communityMembership.findMany({
    where: { userId },
    select: { skillId: true, lastSeenAt: true },
  });
  return Promise.all(
    memberships.map(async (membership) => {
      const [contributions, gaps] = await Promise.all([
        prisma.communityContribution.count({
          where: { skillId: membership.skillId, status: "MERGED", mergedAt: { gt: membership.lastSeenAt } },
        }),
        prisma.gapReport.count({
          where: { skillId: membership.skillId, status: "RESOLVED", updatedAt: { gt: membership.lastSeenAt } },
        }),
      ]);
      return { skillId: membership.skillId, count: contributions + gaps };
    }),
  );
}

export async function myUsefulMarks(userId: string, contributionIds: string[]) {
  if (contributionIds.length === 0) return [];
  const rows = await prisma.usefulMark.findMany({
    where: { userId, contributionId: { in: contributionIds } },
    select: { contributionId: true },
  });
  return rows.map((row) => row.contributionId);
}
