import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  helpChunks,
  parseHelpArticle,
  resourceChunks,
  skillChunk,
  stageChunk,
  type CatalogSkill,
  type CatalogStage,
  type KnowledgeChunkInput,
} from "@/lib/assistant/chunk";
import { isFreePath } from "@/lib/niches/tiers";
import { prisma } from "@/lib/prisma";
import { PRODUCT_FEATURES } from "@/lib/product-features";
import { TOUR_SLIDES } from "@/lib/tour/slides";

export const HELP_DIR = path.join(process.cwd(), "content", "help");

/** content/help/*.md, the guided tour's slides, and the feature list, as help chunks. */
export async function loadHelpChunks(dir = HELP_DIR): Promise<KnowledgeChunkInput[]> {
  const files = (await readdir(dir)).filter((name) => name.endsWith(".md") && !name.startsWith("_")).sort();
  const chunks: KnowledgeChunkInput[] = [];
  for (const file of files) {
    const article = parseHelpArticle(file.replace(/\.md$/, ""), await readFile(path.join(dir, file), "utf8"));
    chunks.push(...helpChunks(article));
  }
  TOUR_SLIDES.forEach((slide) => {
    chunks.push({
      kind: "help",
      refId: `tour-${slide.id}`,
      chunkIndex: 0,
      sourceKey: `help:tour-${slide.id}`,
      skillId: null,
      stageId: null,
      monetized: false,
      title: `Guided tour: ${slide.kicker}`,
      url: "/dashboard?tour=1",
      lessonUrl: null,
      text: `${slide.kicker}\n${slide.heading}\n${slide.body}`,
    });
  });
  chunks.push({
    kind: "help",
    refId: "features",
    chunkIndex: 0,
    sourceKey: "help:features",
    skillId: null,
    stageId: null,
    monetized: false,
    title: "Everything you can use in SkillFlow",
    url: "/dashboard",
    lessonUrl: null,
    text: `SkillFlow features (${PRODUCT_FEATURES.length}):\n${PRODUCT_FEATURES.map((feature) => `- ${feature.name} (${feature.href})`).join("\n")}`,
  });
  return chunks;
}

const STAGE_SELECT = {
  id: true,
  order: true,
  title: true,
  description: true,
  level: true,
  learningObjectives: true,
  monetized: true,
  resources: {
    where: { sourceStatus: "ACTIVE" as const },
    orderBy: { order: "asc" as const },
    select: {
      id: true,
      order: true,
      type: true,
      url: true,
      title: true,
      description: true,
      keyPoints: true,
      provider: true,
      depth: true,
      durationMinutes: true,
      transcript: true,
      monetized: true,
    },
  },
};

function asSkill(skill: { id: string; slug: string; name: string; description: string | null; nicheGroup: string; status: "AVAILABLE" | "COMING_SOON"; offer: "FREE" | "MONETIZED" }, stageCount: number): CatalogSkill {
  return { ...skill, free: isFreePath(skill.slug), stageCount };
}

/** Every niche, stage, and active resource (with transcript windows). An unavailable resource is not indexed. */
export async function loadCatalogChunks(): Promise<KnowledgeChunkInput[]> {
  const skills = await prisma.skill.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      nicheGroup: true,
      status: true,
      offer: true,
      stages: { orderBy: { order: "asc" }, select: STAGE_SELECT },
    },
  });
  const chunks: KnowledgeChunkInput[] = [];
  for (const row of skills) {
    const skill = asSkill(row, row.stages.length);
    chunks.push(skillChunk(skill));
    for (const stage of row.stages) {
      const plain: CatalogStage = { ...stage, level: stage.level };
      chunks.push(stageChunk(skill, plain));
      for (const resource of stage.resources) chunks.push(...resourceChunks(skill, plain, { ...resource, depth: resource.depth ?? null }));
    }
  }
  return chunks;
}

/** The chunks for one resource, or null when it is gone or unavailable. */
export async function loadResourceChunks(resourceId: string): Promise<KnowledgeChunkInput[] | null> {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: {
      sourceStatus: true,
      stage: {
        select: {
          ...STAGE_SELECT,
          resources: { ...STAGE_SELECT.resources, where: { id: resourceId, sourceStatus: "ACTIVE" as const } },
          skill: { select: { id: true, slug: true, name: true, description: true, nicheGroup: true, status: true, offer: true, _count: { select: { stages: true } } } },
        },
      },
    },
  });
  if (!resource || resource.sourceStatus !== "ACTIVE") return null;
  const { skill: skillRow, resources, ...stage } = resource.stage;
  const skill = asSkill(skillRow, skillRow._count.stages);
  const row = resources[0];
  if (!row) return null;
  return resourceChunks(skill, { ...stage }, { ...row, depth: row.depth ?? null });
}
