import "server-only";
import { cache } from "react";
import { invalidateCatalog } from "@/lib/cache/invalidate";
import { explainQuestion } from "@/lib/explain/concepts";
import {
  gateSourceBrief,
  gateSourceHash,
  parseGateConcepts,
  withEveryKeyPoint,
  type GateResourceSource,
} from "@/lib/explain/gate-concepts";
import { explainModelConfig, proposeGateConcepts } from "@/lib/explain/judge";
import { readPracticePage } from "@/lib/explain/page-source";
import { prisma } from "@/lib/prisma";

const PAGE_LIMIT = 6;

function canReadPage(type: string, url: string) {
  if (type !== "DOC_LINK" && type !== "COURSE_LINK") return false;
  return !/youtu\.be|youtube\.com|youtube-nocookie\.com/i.test(url);
}

/**
 * Write the explain-back ideas from this stage's resources when they are missing or the resources changed.
 * A blocked article is skipped. Every stored key point is still kept. Shared catalog data: the write expires the catalog cache.
 */
export const ensureGateConcepts = cache(async (stageId: string): Promise<void> => {
  const stage = await prisma.roadmapStage.findUnique({
    where: { id: stageId },
    include: {
      explainBackPrompt: { select: { conceptSourceHash: true } },
      resources: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          type: true,
          url: true,
          title: true,
          description: true,
          keyPoints: true,
          transcript: true,
          sourceStatus: true,
        },
      },
    },
  });
  if (!stage || stage.resources.length === 0 || !explainModelConfig()) return;

  const sources: GateResourceSource[] = stage.resources.map((resource) => ({
    order: resource.order,
    title: resource.title,
    description: resource.description,
    keyPoints: resource.keyPoints,
    transcript: resource.transcript,
  }));
  const hash = gateSourceHash(stage, sources);
  if (stage.explainBackPrompt?.conceptSourceHash === hash && stage.learningObjectives.some((item) => item.trim())) return;

  const candidates = stage.resources
    .filter((resource) => resource.sourceStatus !== "UNAVAILABLE" && canReadPage(resource.type, resource.url))
    .slice(0, PAGE_LIMIT);
  const read = await Promise.all(
    candidates.map(async (resource) => {
      try {
        const text = await readPracticePage(resource.url);
        return { title: resource.title, text };
      } catch {
        return null;
      }
    }),
  );
  const pages = read.filter((page): page is { title: string; text: string } => page !== null);

  const raw = await proposeGateConcepts(
    gateSourceBrief({ title: stage.title, description: stage.description, resources: sources, pages }),
  );
  if (!raw) return;
  const parsed = parseGateConcepts(raw);
  if (!parsed) return;
  const concepts = withEveryKeyPoint(parsed, stage.resources.flatMap((resource) => resource.keyPoints));
  if (concepts.length === 0) return;

  await prisma.$transaction(async (tx) => {
    await tx.roadmapStage.update({
      where: { id: stage.id },
      data: { learningObjectives: concepts.map((item) => item.concept) },
    });
    await tx.explainBackPrompt.upsert({
      where: { stageId: stage.id },
      create: {
        stageId: stage.id,
        question: explainQuestion(stage.title),
        rubric: concepts.map((item) => item.rubric),
        conceptSourceHash: hash,
      },
      update: {
        question: explainQuestion(stage.title),
        rubric: concepts.map((item) => item.rubric),
        conceptSourceHash: hash,
        version: { increment: 1 },
      },
    });
  });
  try {
    invalidateCatalog();
  } catch (error) {
    const message = error instanceof Error ? error.message : "catalog cache";
    console.error("explain-back gate saved; catalog cache was not cleared", message.slice(0, 180));
  }
});
