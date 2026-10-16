import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG, COMMUNITY_TAG } from "@/lib/cache/tags";
import { isFreePath } from "@/lib/niches/tiers";
import { prisma } from "@/lib/prisma";
import type { SearchEntry } from "@/lib/search/score";

const RESOURCE_KIND: Record<string, string> = {
  HOOK_CLIP: "Clip",
  EMBEDDED_VIDEO: "Video",
  DOC_LINK: "Doc",
  COURSE_LINK: "Course",
};

/**
 * Every niche, stage, resource, and published Open Source post as search entries. The same for every visitor, so it
 * is cached under the catalog and community tags: a catalog edit or a newly published post refreshes it.
 */
export async function loadSearchIndex(): Promise<SearchEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG, COMMUNITY_TAG);

  const [skills, posts] = await Promise.all([
    prisma.skill.findMany({
      orderBy: { order: "asc" },
      select: {
        slug: true,
        name: true,
        description: true,
        status: true,
        stages: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            title: true,
            description: true,
            resources: {
              where: { sourceStatus: "ACTIVE" },
              orderBy: { order: "asc" },
              select: { id: true, title: true, type: true, provider: true },
            },
          },
        },
      },
    }),
    prisma.communityContribution.findMany({
      where: { status: "MERGED" },
      orderBy: { createdAt: "desc" },
      take: 400,
      select: { id: true, title: true, summary: true, skill: { select: { slug: true, name: true } } },
    }),
  ]);

  const entries: SearchEntry[] = [];
  for (const [skillIndex, skill] of skills.entries()) {
    const free = isFreePath(skill.slug);
    entries.push({
      id: `n-${skill.slug}`,
      kind: "niche",
      title: skill.name,
      description: skill.stages.length ? `${skill.stages.length} stages · ${free ? "Free path" : "Premium"}` : skill.status === "AVAILABLE" ? "Premium niche" : "Coming soon",
      keywords: [skill.slug.replace(/-/g, " "), skill.description ?? ""],
      href: `/roadmap/${skill.slug}`,
      icon: "library",
      badge: free ? "Free" : "Premium",
    });
    for (const stage of skill.stages) {
      entries.push({
        id: `s-${stage.id}`,
        kind: "stage",
        title: stage.title,
        description: `${skill.name} · Stage ${stage.order}`,
        keywords: [skill.name, (stage.description ?? "").slice(0, 240)],
        href: `/lesson/${stage.id}`,
        icon: "flag",
        order: skillIndex * 100 + stage.order,
      });
      for (const resource of stage.resources) {
        entries.push({
          id: `r-${resource.id}`,
          kind: "resource",
          title: resource.title,
          description: `${RESOURCE_KIND[resource.type] ?? "Resource"} · ${stage.title}`,
          keywords: [resource.provider, skill.name],
          href: `/lesson/${stage.id}`,
          order: skillIndex * 100 + stage.order,
          icon: resource.type === "EMBEDDED_VIDEO" || resource.type === "HOOK_CLIP" ? "circle-play" : resource.type === "COURSE_LINK" ? "graduation-cap" : "file-text",
        });
      }
    }
  }
  for (const post of posts) {
    entries.push({
      id: `o-${post.id}`,
      kind: "post",
      title: post.title,
      description: `Open Source · ${post.skill.name}`,
      keywords: [post.summary.slice(0, 240)],
      href: `/open-source/${post.skill.slug}/c/${post.id}`,
      icon: "git-pull-request",
    });
  }
  return entries;
}
