import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG, LANDING_STATS_TAG } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { PRODUCT_FEATURES } from "@/lib/product-features";

export type LandingStats = {
  learners: number;
  niches: number;
  stages: number;
  resources: number;
  ideas: number;
  features: number;
};

/**
 * Real totals for the landing page, the same for every visitor. Sign-up and account deletion drop the
 * `landing-stats` tag, and catalog writes drop `catalog`, so the page prerenders and stays current.
 */
export async function loadLandingStats(): Promise<LandingStats> {
  "use cache";
  cacheLife("hours");
  cacheTag(LANDING_STATS_TAG, CATALOG_TAG);

  const [learners, niches, stages, resources, ideas] = await Promise.all([
    prisma.user.count(),
    prisma.skill.count(),
    prisma.roadmapStage.count(),
    prisma.resource.count({ where: { sourceStatus: "ACTIVE" } }),
    prisma.learnerNote.count({ where: { kind: "stage" } }),
  ]);
  return { learners, niches, stages, resources, ideas, features: PRODUCT_FEATURES.length };
}
