import "server-only";
import type { ContributionStatus, Prisma } from "@prisma/client";
import { CONTRIBUTION_STATUSES } from "@/lib/community-copy";
import { decodeCursor, encodeCursor, loadCommunityGaps } from "@/lib/data/community";
import { loadPublicCatalog } from "@/lib/data/public-catalog";
import { prisma } from "@/lib/prisma";

// The author's own contributions. Per person, on the request. Never inside "use cache".

export const MY_PAGE_SIZE = 20;

export type MyRow = {
  id: string;
  type: string;
  title: string;
  status: ContributionStatus;
  revision: number;
  updatedAt: string;
  skill: { slug: string; name: string };
};

/** Contributions waiting on the author: changes were requested. */
export async function myAttentionCount(userId: string) {
  return prisma.communityContribution.count({ where: { authorId: userId, status: "CHANGES_REQUESTED" } });
}

export async function loadMyContributions(
  userId: string,
  query: { status: string; cursor: string },
): Promise<{ items: MyRow[]; nextCursor: string | null }> {
  const status = CONTRIBUTION_STATUSES.some((item) => item.id === query.status) ? (query.status as ContributionStatus) : undefined;
  const cursor = decodeCursor("newest", query.cursor);
  const where: Prisma.CommunityContributionWhereInput = { authorId: userId, ...(status ? { status } : {}) };
  if (cursor && "createdAt" in cursor) {
    where.AND = [{ OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] }];
  }

  const rows = await prisma.communityContribution.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MY_PAGE_SIZE + 1,
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      revision: true,
      createdAt: true,
      updatedAt: true,
      skill: { select: { slug: true, name: true } },
    },
  });

  const page = rows.slice(0, MY_PAGE_SIZE);
  const last = page[page.length - 1];
  return {
    items: page.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      revision: row.revision,
      updatedAt: row.updatedAt.toISOString(),
      skill: row.skill,
    })),
    nextCursor: rows.length > MY_PAGE_SIZE && last ? encodeCursor("newest", last) : null,
  };
}

/** One of the author's contributions with its review history. Reviewers by display name only. */
export async function loadMyContribution(userId: string, id: string) {
  const row = await prisma.communityContribution.findFirst({
    where: { id, authorId: userId },
    select: {
      id: true,
      skillId: true,
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
      stageId: true,
      gapId: true,
      createdAt: true,
      updatedAt: true,
      mergedAt: true,
      skill: { select: { slug: true, name: true, status: true } },
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
          unmerge: true,
          createdAt: true,
          reviewer: { select: { name: true } },
        },
      },
    },
  });
  return row;
}

export type GapOption = { id: string; title: string; goodFirst: boolean };

/** Stages and open gaps for the contribute form. Both lists are shared, cached data. */
export async function contributeOptions(skill: { id: string; slug: string; status: string }, keepGapId?: string | null) {
  const [catalog, gaps] = await Promise.all([loadPublicCatalog(), loadCommunityGaps(skill.id)]);
  const stages =
    skill.status === "AVAILABLE" || skill.status === "available"
      ? (catalog.find((entry) => entry.skill.slug === skill.slug)?.stages ?? []).map((stage) => ({
          id: stage.id,
          order: stage.order,
          title: stage.title,
        }))
      : [];
  // Already sorted: open good-first, open, then the rest. An edit keeps the gap it cites even when that gap is no longer open.
  const gapOptions: GapOption[] = gaps
    .filter((gap) => gap.status === "OPEN" || gap.id === keepGapId)
    .map((gap) => ({ id: gap.id, title: gap.status === "OPEN" ? gap.title : `${gap.title} (${gap.status.toLowerCase()})`, goodFirst: gap.goodFirst }));
  return { stages, gaps: gapOptions };
}
