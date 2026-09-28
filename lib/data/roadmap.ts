import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { findSkill, listSkills, listStages } from "@/lib/mock/catalog";
import type { RoadmapDetailData, RoadmapIndexData } from "@/lib/types/pages";

export async function getRoadmapIndex(): Promise<RoadmapIndexData> {
  await devDelay();
  const skills = listSkills();
  const followed = skills
    .filter((skill) => skill.followed)
    .map((skill) => {
      const stages = listStages(skill.id);
      const current = stages.find((stage) => stage.status === "in_progress") ?? stages.find((stage) => stage.status !== "locked");
      return {
        skill,
        stagePosition: current ? `Stage ${current.order} of ${stages.length}` : `0 of ${stages.length}`,
        stageTitle: current?.title ?? "Not started",
        continueHref: current ? `/lesson/${current.id}` : `/roadmap/${skill.slug}`,
      };
    });

  return {
    followed,
    availableToAdd: skills.filter((skill) => !skill.followed),
  };
}

export async function getRoadmap(skillSlug: string): Promise<RoadmapDetailData | null> {
  await devDelay();
  const skill = findSkill(skillSlug);
  if (!skill) return null;
  const stages = listStages(skill.id);
  const current = stages.find((stage) => stage.status === "in_progress");
  const position = current ? `Stage ${current.order} of ${stages.length}` : stages.length ? `${stages.length} stages` : "No stages yet";
  return { skill, stages, currentPosition: position };
}
