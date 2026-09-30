import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cache/tags";
import { loadPublicCatalog } from "@/lib/data/public-catalog";
import { nicheMeta } from "@/lib/niche-meta";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { NICHE_TEASER_CLEAR, NICHE_TEASER_PEEK } from "./niche-layout";
import { SkillBrowse, type BrowseSkill } from "./SkillBrowse";

/** Twelve tile placeholders while the cached teaser resolves. */
export function NicheTeaserFallback() {
  return (
    <div className="sf-niche-teaser" aria-busy="true">
      <p className="sf-sr">Loading niches</p>
      <ul className="sf-browse-grid">
        {Array.from({ length: NICHE_TEASER_CLEAR }, (_, index) => (
          <li key={index}>
            <Skeleton height={280} radius="22px" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The niche grid. Same cards for every learner until the catalog changes.
 * `page` is the full list, paginated in the browser. `teaser` is the first rows for Home and Roadmaps.
 * The page number is not a cache argument, so both modes stay one catalog entry each.
 */
export async function NicheGrid({ mode = "page" }: { mode?: "page" | "teaser" }) {
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
      communityHref: `/open-source/${entry.skill.slug}`,
      group: meta.group,
      tags: meta.tags,
    };
  });

  const shown = mode === "teaser" ? skills.slice(0, NICHE_TEASER_CLEAR + NICHE_TEASER_PEEK) : skills;
  return <SkillBrowse skills={shown} mode={mode} />;
}
