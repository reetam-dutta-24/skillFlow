import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cache/tags";
import { loadPublicClips } from "@/lib/data/clips";
import { prisma } from "@/lib/prisma";

export type LandingReel = { id: string; title: string; stage: string; url: string; poster: string | null; creator: boolean };
export type LandingReelNiche = { slug: string; name: string; reels: LandingReel[] };

const NICHES = 4;
const PER_NICHE = 5;

/**
 * Real clips for the landing page's reel showcase: a few niches, a handful of clips each, with the stage photo as the
 * poster. The same for every visitor, so it shares the catalog cache; a catalog change expires it with the rest.
 */
export async function loadLandingReels(): Promise<LandingReelNiche[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const clips = (await loadPublicClips()).filter((clip) => clip.media === "embed");
  const bySkill = new Map<string, { name: string; clips: typeof clips }>();
  for (const clip of clips) {
    const entry = bySkill.get(clip.skillSlug) ?? { name: clip.skillName, clips: [] };
    entry.clips.push(clip);
    bySkill.set(clip.skillSlug, entry);
  }
  // Prefer short clips, the format the feed is built for, then fill with stage videos.
  const chosen = [...bySkill.entries()]
    .filter(([, entry]) => entry.clips.length >= 3)
    .slice(0, NICHES)
    .map(([slug, entry]) => ({
      slug,
      name: entry.name,
      clips: [...entry.clips].sort((a, b) => Number(b.format === "short") - Number(a.format === "short")).slice(0, PER_NICHE),
    }));

  const stageIds = chosen.flatMap((niche) => niche.clips.map((clip) => clip.attributionHref.replace("/lesson/", "")));
  const stages = await prisma.roadmapStage.findMany({ where: { id: { in: stageIds } }, select: { id: true, image: true } });
  const poster = new Map(stages.map((stage) => [stage.id, stage.image]));

  return chosen.map((niche) => ({
    slug: niche.slug,
    name: niche.name,
    reels: niche.clips.map((clip) => ({
      id: clip.id,
      title: clip.title,
      stage: clip.stageTitle,
      url: clip.url,
      poster: poster.get(clip.attributionHref.replace("/lesson/", "")) ?? null,
      creator: !clip.attributionHref.startsWith("/lesson/"),
    })),
  }));
}
