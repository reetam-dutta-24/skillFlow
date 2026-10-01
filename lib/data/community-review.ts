import "server-only";
import type { ContributionType, Prisma } from "@prisma/client";
import { CONTRIBUTION_TYPES } from "@/lib/community-copy";
import { decodeCursor, encodeCursor, loadCommunityNiches } from "@/lib/data/community";
import { normalizeCommunityUrl } from "@/lib/links/normalize-url";
import { prisma } from "@/lib/prisma";
import { communityActor } from "@/lib/services/community/actor";
import { canReview, reviewableSkillIds, type CommunityActor } from "@/lib/services/community/permissions";

// Everything in this file is per person. Nothing here is cached, and nothing here may be called inside "use cache".

export const REVIEW_PAGE_SIZE = 20;

export type ReviewAccess = { actor: CommunityActor; skillIds: "all" | string[] };

export type ReviewRow = {
  id: string;
  type: ContributionType;
  title: string;
  createdAt: string;
  revision: number;
  linkStatus: string;
  disclosure: string;
  author: string;
  skill: { slug: string; name: string };
};

/** Null when this person reviews no niche. */
export async function reviewAccess(userId: string): Promise<ReviewAccess | null> {
  const actor = await communityActor(userId);
  if (!actor) return null;
  const skillIds = reviewableSkillIds(actor);
  if (skillIds !== "all" && skillIds.length === 0) return null;
  return { actor, skillIds };
}

/** Open contributions this person may review: their niches, and never their own. A former member's post stays reviewable. */
function openWhere(access: ReviewAccess, skillId?: string): Prisma.CommunityContributionWhereInput {
  let scope: Prisma.CommunityContributionWhereInput["skillId"];
  if (skillId) {
    scope = access.skillIds === "all" || access.skillIds.includes(skillId) ? skillId : { in: [] };
  } else if (access.skillIds !== "all") {
    scope = { in: access.skillIds };
  }
  return {
    status: "OPEN",
    ...(scope ? { skillId: scope } : {}),
    OR: [{ authorId: null }, { authorId: { not: access.actor.id } }],
  };
}

/** Sidebar badge. Null hides the Review link. */
export async function myOpenReviewCount(userId: string): Promise<number | null> {
  const access = await reviewAccess(userId);
  if (!access) return null;
  return prisma.communityContribution.count({ where: openWhere(access) });
}

/** Niches for the queue filter. Names come from the shared community list. */
export async function reviewNiches(access: ReviewAccess) {
  const niches = await loadCommunityNiches();
  return niches
    .filter((niche) => access.skillIds === "all" || access.skillIds.includes(niche.id))
    .map((niche) => ({ id: niche.id, slug: niche.slug, name: niche.name }));
}

/** Oldest first, so nothing waits forever behind newer posts. */
export async function loadReviewQueue(
  access: ReviewAccess,
  query: { skillId: string; type: string; cursor: string },
): Promise<{ items: ReviewRow[]; nextCursor: string | null }> {
  const type = CONTRIBUTION_TYPES.some((item) => item.id === query.type) ? (query.type as ContributionType) : undefined;
  const cursor = decodeCursor("oldest", query.cursor);
  const where: Prisma.CommunityContributionWhereInput = {
    ...openWhere(access, query.skillId || undefined),
    ...(type ? { type } : {}),
  };
  if (cursor && "createdAt" in cursor) {
    where.AND = [{ OR: [{ createdAt: { gt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { gt: cursor.id } }] }];
  }

  const rows = await prisma.communityContribution.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: REVIEW_PAGE_SIZE + 1,
    select: {
      id: true,
      type: true,
      title: true,
      createdAt: true,
      revision: true,
      linkStatus: true,
      disclosure: true,
      author: { select: { name: true } },
      skill: { select: { slug: true, name: true } },
    },
  });

  const page = rows.slice(0, REVIEW_PAGE_SIZE);
  const last = page[page.length - 1];
  return {
    items: page.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
      revision: row.revision,
      linkStatus: row.linkStatus,
      disclosure: row.disclosure,
      author: row.author?.name ?? "Former member",
      skill: row.skill,
    })),
    nextCursor: rows.length > REVIEW_PAGE_SIZE && last ? encodeCursor("oldest", last) : null,
  };
}

/** Where a reviewer lands after a decision. */
export async function nextReviewId(userId: string): Promise<string | null> {
  const access = await reviewAccess(userId);
  if (!access) return null;
  const row = await prisma.communityContribution.findFirst({
    where: openWhere(access),
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  return row?.id ?? null;
}

const duplicateSelect = {
  id: true,
  title: true,
  status: true,
  author: { select: { name: true } },
} satisfies Prisma.CommunityContributionSelect;

async function authorRecord(authorId: string | null, skillId: string) {
  if (!authorId) return null;
  const rows = await prisma.communityContribution.groupBy({
    by: ["status"],
    where: { authorId, skillId, status: { in: ["MERGED", "CLOSED"] } },
    _count: { _all: true },
  });
  const count = (status: string) => rows.find((row) => row.status === status)?._count._all ?? 0;
  return { merged: count("MERGED"), closed: count("CLOSED") };
}

async function sameLink(id: string, skillId: string, urls: string[]) {
  if (urls.length === 0) return [];
  return prisma.communityContribution.findMany({
    where: { skillId, id: { not: id }, OR: [{ normalizedUrl: { in: urls } }, { sources: { hasSome: urls } }] },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: duplicateSelect,
  });
}

async function sameTitle(id: string, skillId: string, title: string) {
  return prisma.communityContribution.findMany({
    where: { skillId, id: { not: id }, title: { equals: title.trim(), mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: duplicateSelect,
  });
}

/** Official resource URLs are stored as written, so they are normalized here before comparing. */
async function officialMatches(skillId: string, urls: string[]) {
  if (urls.length === 0) return [];
  const wanted = new Set(urls);
  const rows = await prisma.resource.findMany({
    where: { stage: { skillId } },
    select: { id: true, title: true, url: true, stage: { select: { order: true, title: true } } },
  });
  return rows.filter((row) => {
    const normalized = normalizeCommunityUrl(row.url);
    return normalized !== null && wanted.has(normalized);
  });
}

/** One contribution for the review page. Null when it is missing or outside the niches this person reviews. */
export async function loadReviewItem(access: ReviewAccess, id: string) {
  const row = await prisma.communityContribution.findUnique({
    where: { id },
    select: {
      id: true,
      skillId: true,
      authorId: true,
      type: true,
      status: true,
      title: true,
      summary: true,
      body: true,
      imageUrl: true,
      sources: true,
      steps: true,
      tags: true,
      disclosure: true,
      linkStatus: true,
      linkCheckedAt: true,
      revision: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true } },
      skill: { select: { slug: true, name: true } },
      stage: { select: { order: true, title: true } },
      gap: { select: { id: true, title: true, status: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          decision: true,
          reason: true,
          feedback: true,
          revision: true,
          createdAt: true,
          reviewer: { select: { name: true } },
        },
      },
    },
  });
  if (!row || !canReview(access.actor, row.skillId)) return null;

  // Sources are normalized when a contribution is saved.
  const [record, links, titles, official] = await Promise.all([
    authorRecord(row.authorId, row.skillId),
    sameLink(row.id, row.skillId, row.sources),
    sameTitle(row.id, row.skillId, row.title),
    officialMatches(row.skillId, row.sources),
  ]);

  return {
    ...row,
    isOwn: row.authorId === access.actor.id,
    record,
    duplicates: { links, titles, official },
  };
}
