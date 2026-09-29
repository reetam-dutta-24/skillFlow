import "server-only";
import { cache } from "react";
import { loadCatalog } from "@/lib/data/catalog";
import type { RoadmapDetailData, RoadmapIndexData } from "@/lib/types/pages";

export async function getRoadmapIndex(): Promise<RoadmapIndexData> {
  const catalog = await loadCatalog();
  const followed = catalog
    .filter((entry) => entry.skill.followed)
    .map((entry) => {
      const current =
        entry.stages.find((stage) => stage.status === "in_progress") ??
        entry.stages.find((stage) => stage.status !== "locked");
      return {
        skill: entry.skill,
        stagePosition:
          entry.stages.length === 0
            ? "No stages yet"
            : current
              ? `Stage ${current.order} of ${entry.stages.length}`
              : `${entry.stages.length} stages`,
        stageTitle: current?.title ?? "",
        continueHref: current ? `/lesson/${current.id}` : `/roadmap/${entry.skill.slug}`,
      };
    });

  return {
    followed,
    availableToAdd: catalog.filter((entry) => !entry.skill.followed).map((entry) => entry.skill),
  };
}

export const getRoadmap = cache(async (skillSlug: string): Promise<RoadmapDetailData | null> => {
  const catalog = await loadCatalog();
  const entry = catalog.find((item) => item.skill.slug === skillSlug);
  if (!entry) return null;
  const current = entry.stages.find((stage) => stage.status === "in_progress");
  const currentPosition =
    entry.stages.length === 0
      ? "No stages yet"
      : current
        ? `Stage ${current.order} of ${entry.stages.length}`
        : `${entry.stages.length} stages`;
  return { skill: entry.skill, stages: entry.stages, currentPosition };
});
