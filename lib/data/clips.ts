import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cache/tags";
import { loadCatalog } from "@/lib/data/catalog";
import { loadPublicCatalog } from "@/lib/data/public-catalog";
import { prisma } from "@/lib/prisma";
import type { ClipFeedData, ClipFeedSkill, ClipItem } from "@/lib/types/pages";

function skillRank(skill: ClipFeedSkill) {
  if (skill.status === "coming_soon") return 2;
  if (skill.followed) return 0;
  return 1;
}

/** Open-stage clips. The list does not change from one learner to the next. */
export async function loadPublicClips(): Promise<ClipItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const catalog = await loadPublicCatalog();
  const open = catalog.flatMap((entry) =>
    entry.stages.filter((stage) => stage.open).map((stage) => ({ stage, skill: entry.skill })),
  );
  const byStage = new Map(open.map((item) => [item.stage.id, item]));
  const [rows, creatorClips] = await Promise.all([
    byStage.size === 0
      ? Promise.resolve([])
      : prisma.resource.findMany({
          where: {
            stageId: { in: [...byStage.keys()] },
            type: { in: ["HOOK_CLIP", "EMBEDDED_VIDEO"] },
          },
        }),
    loadLiveCreatorClips(),
  ]);

  const catalogClips = rows
    .flatMap((row) => {
      const owner = byStage.get(row.stageId);
      if (!owner) return [];
      return [{ row, owner }];
    })
    .sort(
      (a, b) =>
        a.owner.skill.order - b.owner.skill.order ||
        a.owner.stage.order - b.owner.stage.order ||
        a.row.order - b.row.order,
    )
    .map(({ row, owner }) => ({
      id: row.id,
      skillSlug: owner.skill.slug,
      skillName: owner.skill.name,
      stageTitle: owner.stage.title,
      title: row.title,
      description: row.description,
      keyPoints: row.keyPoints,
      url: row.url,
      format: row.type === "HOOK_CLIP" ? ("short" as const) : ("video" as const),
      media: "embed" as const,
      attributionHref: `/lesson/${owner.stage.id}`,
      attributionLabel: "Open lesson",
    }));

  return [...catalogClips, ...creatorClips];
}

async function loadLiveCreatorClips(): Promise<ClipItem[]> {
  const rows = await prisma.creatorWork.findMany({
    where: { status: "LIVE", skill: { status: "AVAILABLE" } },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      format: true,
      mediaUrl: true,
      skill: { select: { slug: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    skillSlug: row.skill.slug,
    skillName: row.skill.name,
    stageTitle: "Creator",
    title: row.title,
    description: row.description,
    keyPoints: [],
    url: row.mediaUrl,
    format: row.format === "SHORT" ? "short" : "video",
    media: "file" as const,
    attributionHref: `/profile/${row.owner.id}`,
    attributionLabel: `By ${row.owner.name?.trim() || "Creator"}`,
  }));
}

/** Open stages only. A locked stage does not put its clips in the feed. */
export async function getClipFeed(): Promise<ClipFeedData> {
  const [catalog, clips] = await Promise.all([loadCatalog(), loadPublicClips()]);
  const skills: ClipFeedSkill[] = catalog.map((entry) => ({
    slug: entry.skill.slug,
    name: entry.skill.name,
    image: entry.skill.image,
    status: entry.skill.status,
    followed: entry.skill.followed,
    order: entry.skill.order,
  }));
  skills.sort((a, b) => skillRank(a) - skillRank(b) || a.order - b.order);
  return { skills, clips };
}
