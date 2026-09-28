import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { listResources, listSkills, listStages } from "@/lib/mock/catalog";
import type { ClipFeedData, ClipFeedSkill, ClipItem } from "@/lib/types/pages";

function skillRank(skill: ClipFeedSkill) {
  if (skill.status === "coming_soon") return 2;
  if (skill.followed) return 0;
  return 1;
}

export async function getClipFeed(): Promise<ClipFeedData> {
  await devDelay();
  const skills = listSkills().map((skill) => ({
    slug: skill.slug,
    name: skill.name,
    status: skill.status,
    followed: skill.followed,
    order: skill.order,
  }));
  skills.sort((a, b) => skillRank(a) - skillRank(b) || a.order - b.order);

  const clips: ClipItem[] = [];
  for (const skill of listSkills()) {
    if (skill.status === "coming_soon") continue;
    for (const stage of listStages(skill.id)) {
      if (stage.status === "locked") continue;
      for (const resource of listResources(stage.id)) {
        if (resource.unavailable) continue;
        if (resource.type !== "HOOK_CLIP" && resource.type !== "EMBEDDED_VIDEO") continue;
        clips.push({
          id: resource.id,
          skillSlug: skill.slug,
          skillName: skill.name,
          stageTitle: stage.title,
          title: resource.title,
          description: resource.description,
          keyPoints: resource.keyPoints,
          url: resource.url,
          format: resource.type === "HOOK_CLIP" ? "short" : "video",
          lessonHref: `/lesson/${stage.id}`,
        });
      }
    }
  }

  return { skills, clips };
}
