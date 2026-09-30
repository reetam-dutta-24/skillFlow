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
  if (byStage.size === 0) return [];

  const rows = await prisma.resource.findMany({
    where: {
      stageId: { in: [...byStage.keys()] },
      type: { in: ["HOOK_CLIP", "EMBEDDED_VIDEO"] },
    },
  });

  return rows
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
      format: row.type === "HOOK_CLIP" ? "short" : "video",
      lessonHref: `/lesson/${owner.stage.id}`,
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
