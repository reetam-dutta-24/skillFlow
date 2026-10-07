import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cache/tags";
import { loadPublicCatalog } from "@/lib/data/public-catalog";
import { prisma } from "@/lib/prisma";

export type CreatorSkillOption = { id: string; name: string; slug: string };

export type StudioWork = {
  id: string;
  title: string;
  description: string;
  format: "short" | "video";
  status: "DRAFT" | "PENDING" | "LIVE" | "REJECTED";
  skillId: string;
  skillName: string;
  skillSlug: string;
  mediaUrl: string;
  reviewNotes: string | null;
  views: number;
  watchSec: number;
  finished: number;
  durationSec: number;
};

export type PublicCreatorWork = {
  id: string;
  title: string;
  description: string;
  format: "short" | "video";
  skillName: string;
  skillSlug: string;
  mediaUrl: string;
};

export type PublicCreatorProfile = {
  id: string;
  name: string;
  works: PublicCreatorWork[];
};

const workSelect = {
  id: true,
  title: true,
  description: true,
  format: true,
  status: true,
  skillId: true,
  mediaUrl: true,
  reviewNotes: true,
  durationSec: true,
  skill: { select: { name: true, slug: true } },
} as const;

function asFormat(format: "SHORT" | "VIDEO"): "short" | "video" {
  return format === "SHORT" ? "short" : "video";
}

async function statsFor(ids: string[]) {
  const empty = new Map<string, { views: number; watchSec: number; finished: number }>();
  if (ids.length === 0) return empty;
  const [all, done] = await Promise.all([
    prisma.creatorView.groupBy({
      by: ["workId"],
      where: { workId: { in: ids } },
      _count: { _all: true },
      _sum: { watchedSec: true },
    }),
    prisma.creatorView.groupBy({
      by: ["workId"],
      where: { workId: { in: ids }, completed: true },
      _count: { _all: true },
    }),
  ]);
  const finished = new Map(done.map((row) => [row.workId, row._count._all]));
  for (const row of all) {
    empty.set(row.workId, {
      views: row._count._all,
      watchSec: row._sum.watchedSec ?? 0,
      finished: finished.get(row.workId) ?? 0,
    });
  }
  return empty;
}

/** Niches a creator can attach a video to. Read from the shared catalog. */
export async function listCreatorSkills(): Promise<CreatorSkillOption[]> {
  const catalog = await loadPublicCatalog();
  return catalog
    .filter((entry) => entry.skill.status === "available")
    .map((entry) => ({ id: entry.skill.id, name: entry.skill.name, slug: entry.skill.slug }));
}

export async function listStudioWorks(ownerId: string): Promise<StudioWork[]> {
  const rows = await prisma.creatorWork.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    select: workSelect,
  });
  const stats = await statsFor(rows.map((row) => row.id));
  return rows.map((row) => {
    const stat = stats.get(row.id);
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      format: asFormat(row.format),
      status: row.status,
      skillId: row.skillId,
      skillName: row.skill.name,
      skillSlug: row.skill.slug,
      mediaUrl: row.mediaUrl,
      reviewNotes: row.reviewNotes,
      views: stat?.views ?? 0,
      watchSec: stat?.watchSec ?? 0,
      finished: stat?.finished ?? 0,
      durationSec: row.durationSec,
    };
  });
}

export async function getStudioWork(ownerId: string, workId: string): Promise<StudioWork | null> {
  const row = await prisma.creatorWork.findFirst({
    where: { id: workId, ownerId },
    select: workSelect,
  });
  if (!row) return null;
  const stats = await statsFor([row.id]);
  const stat = stats.get(row.id);
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    format: asFormat(row.format),
    status: row.status,
    skillId: row.skillId,
    skillName: row.skill.name,
    skillSlug: row.skill.slug,
    mediaUrl: row.mediaUrl,
    reviewNotes: row.reviewNotes,
    views: stat?.views ?? 0,
    watchSec: stat?.watchSec ?? 0,
    finished: stat?.finished ?? 0,
    durationSec: row.durationSec,
  };
}

/** Live videos for a public profile. The same list for every visitor. No view counts. */
export async function loadPublicCreatorProfile(userId: string): Promise<PublicCreatorProfile | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      creatorWorks: {
        where: { status: "LIVE" },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          format: true,
          mediaUrl: true,
          skill: { select: { name: true, slug: true } },
        },
      },
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name?.trim() || "Creator",
    works: user.creatorWorks.map((work) => ({
      id: work.id,
      title: work.title,
      description: work.description ?? "",
      format: asFormat(work.format),
      skillName: work.skill.name,
      skillSlug: work.skill.slug,
      mediaUrl: work.mediaUrl,
    })),
  };
}

export type CreatorQueueItem = {
  id: string;
  title: string;
  description: string;
  format: "short" | "video";
  skillName: string;
  ownerName: string;
  mediaUrl: string;
  submittedAt: string;
};

export async function listCreatorQueue(): Promise<CreatorQueueItem[]> {
  const rows = await prisma.creatorWork.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      format: true,
      mediaUrl: true,
      submittedAt: true,
      skill: { select: { name: true } },
      owner: { select: { name: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    format: asFormat(row.format),
    skillName: row.skill.name,
    ownerName: row.owner.name?.trim() || "Creator",
    mediaUrl: row.mediaUrl,
    submittedAt: row.submittedAt?.toISOString() ?? "",
  }));
}
