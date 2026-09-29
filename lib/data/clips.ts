import "server-only";
import { prisma } from "@/lib/prisma";
import { loadCatalog } from "@/lib/data/catalog";
import type { ClipFeedData, ClipFeedSkill, ClipItem } from "@/lib/types/pages";

function skillRank(skill: ClipFeedSkill) {
  if (skill.status === "coming_soon") return 2;
  if (skill.followed) return 0;
  return 1;
}

/** Open stages only. A locked stage does not put its clips in the feed. */
export async function getClipFeed(): Promise<ClipFeedData> {
  const catalog = await loadCatalog();
  const skills: ClipFeedSkill[] = catalog.map((entry) => ({
    slug: entry.skill.slug,
    name: entry.skill.name,
    status: entry.skill.status,
    followed: entry.skill.followed,
    order: entry.skill.order,
  }));
  skills.sort((a, b) => skillRank(a) - skillRank(b) || a.order - b.order);

  const open = catalog.flatMap((entry) => {
    if (entry.skill.status === "coming_soon") return [];
    return entry.stages
      .filter((stage) => stage.status !== "locked")
      .map((stage) => ({ stage, skill: entry.skill }));
  });
  const byStage = new Map(open.map((item) => [item.stage.id, item]));
  if (byStage.size === 0) return { skills, clips: [] };

  const rows = await prisma.resource.findMany({
    where: {
      stageId: { in: [...byStage.keys()] },
      type: { in: ["HOOK_CLIP", "EMBEDDED_VIDEO"] },
    },
  });

  const clips: ClipItem[] = rows
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

  return { skills, clips };
}
