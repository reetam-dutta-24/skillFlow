import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cache/tags";
import { loadPublicCatalog } from "@/lib/data/public-catalog";
import { nicheMeta } from "@/lib/niche-meta";
import { SkillBrowse, type BrowseSkill } from "./SkillBrowse";

/** The niche grid. Same cards for every learner until the catalog changes. */
export async function NicheGrid() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const catalog = await loadPublicCatalog();
  const skills: BrowseSkill[] = catalog.map((entry) => {
    const meta = nicheMeta(entry.skill.slug);
    return {
      id: entry.skill.id,
      name: entry.skill.name,
      description: entry.skill.description ?? "",
      status: entry.skill.status,
      offer: entry.skill.offer,
      followed: false,
      stageCount: entry.stages.length,
      image: entry.skill.image,
      href: entry.skill.status === "available" && entry.stages.length > 0 ? `/roadmap/${entry.skill.slug}` : null,
      group: meta.group,
      tags: meta.tags,
    };
  });

  return <SkillBrowse skills={skills} />;
}
