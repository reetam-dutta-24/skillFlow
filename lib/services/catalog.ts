import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  deleteByIdSchema,
  explainBackPromptSchema,
  firstIssue,
  reorderResourcesSchema,
  reorderStagesSchema,
  resourceSchema,
  setSkillStatusSchema,
  skillSchema,
  stageSchema,
} from "@/lib/validators/catalog";
import { mergeResourceTags, readTagOrigins, type ResourceTags } from "@/lib/plan/tags";

/** A Prisma client or the transaction the importer is already inside. */
export type CatalogDb = Prisma.TransactionClient;

export type CatalogWrite<T> = { ok: true; data: T } | { ok: false; error: string };

function client(db?: CatalogDb): CatalogDb {
  return db ?? (prisma as unknown as CatalogDb);
}

async function withDb<T>(db: CatalogDb | undefined, run: (tx: CatalogDb) => Promise<T>) {
  if (db) return run(db);
  return prisma.$transaction(run);
}

function uniqueMessage(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return null;
  const target = Array.isArray(error.meta?.target) ? error.meta.target.join(" ") : "";
  if (target.includes("url")) return "That link is already on this stage.";
  if (target.includes("order")) return "That position is already used.";
  return "That catalog entry already exists.";
}

function defined<T extends Record<string, unknown>>(fields: T) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export async function upsertSkill(input: unknown, db?: CatalogDb): Promise<CatalogWrite<{ id: string; slug: string }>> {
  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const data = parsed.data;

  return withDb(db, async (tx) => {
    const existing = await tx.skill.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (existing) {
      const skill = await tx.skill.update({
        where: { id: existing.id },
        data: defined({
          name: data.name,
          description: data.description,
          image: data.image,
          status: data.status,
          isFlagship: data.isFlagship,
          order: data.order,
        }),
        select: { id: true, slug: true },
      });
      return { ok: true, data: skill };
    }

    if (!data.image) return { ok: false, error: "Add an image." };
    const last = await tx.skill.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    const skill = await tx.skill.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        image: data.image,
        status: data.status ?? "COMING_SOON",
        isFlagship: data.isFlagship ?? false,
        order: data.order ?? (last?.order ?? 0) + 1,
      },
      select: { id: true, slug: true },
    });
    return { ok: true, data: skill };
  });
}

export async function setSkillStatus(input: unknown, db?: CatalogDb): Promise<CatalogWrite<{ id: string; status: "AVAILABLE" | "COMING_SOON" }>> {
  const parsed = setSkillStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  try {
    const skill = await client(db).skill.update({
      where: { id: parsed.data.skillId },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });
    return { ok: true, data: skill };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "That skill is no longer there." };
    }
    throw error;
  }
}

export async function upsertStage(input: unknown, db?: CatalogDb): Promise<CatalogWrite<{ id: string; skillId: string; order: number }>> {
  const parsed = stageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const data = parsed.data;

  return withDb(db, async (tx) => {
    const skill = await tx.skill.findUnique({ where: { id: data.skillId }, select: { id: true } });
    if (!skill) return { ok: false, error: "Choose a skill that exists." };

    const existing = await tx.roadmapStage.findUnique({
      where: { skillId_order: { skillId: data.skillId, order: data.order } },
      select: { id: true },
    });
    if (existing) {
      const stage = await tx.roadmapStage.update({
        where: { id: existing.id },
        data: defined({
          title: data.title,
          description: data.description,
          image: data.image,
          level: data.level,
          learningObjectives: data.learningObjectives,
        }),
        select: { id: true, skillId: true, order: true },
      });
      return { ok: true, data: stage };
    }

    const stage = await tx.roadmapStage.create({
      data: {
        skillId: data.skillId,
        order: data.order,
        title: data.title,
        description: data.description ?? null,
        image: data.image ?? null,
        level: data.level ?? "BEGINNER",
        learningObjectives: data.learningObjectives ?? [],
      },
      select: { id: true, skillId: true, order: true },
    });
    return { ok: true, data: stage };
  });
}

export async function deleteStage(input: unknown, db?: CatalogDb): Promise<CatalogWrite<{ id: string }>> {
  const parsed = deleteByIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  try {
    await client(db).roadmapStage.delete({ where: { id: parsed.data.id } });
    return { ok: true, data: { id: parsed.data.id } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "That stage is no longer there." };
    }
    throw error;
  }
}

export async function reorderStages(input: unknown, db?: CatalogDb): Promise<CatalogWrite<{ stageIds: string[] }>> {
  const parsed = reorderStagesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { skillId, stageIds } = parsed.data;
  if (new Set(stageIds).size !== stageIds.length) return { ok: false, error: "Each stage can appear only once." };

  return withDb(db, async (tx) => {
    const stages = await tx.roadmapStage.findMany({ where: { skillId }, select: { id: true } });
    const current = new Set(stages.map((stage) => stage.id));
    if (current.size !== stageIds.length || stageIds.some((id) => !current.has(id))) {
      return { ok: false, error: "Reorder the stages that are on this skill." };
    }
    for (let index = 0; index < stageIds.length; index += 1) {
      await tx.roadmapStage.update({ where: { id: stageIds[index] }, data: { order: -(index + 1) } });
    }
    for (let index = 0; index < stageIds.length; index += 1) {
      await tx.roadmapStage.update({ where: { id: stageIds[index] }, data: { order: index + 1 } });
    }
    return { ok: true, data: { stageIds } };
  });
}

export async function upsertResource(
  input: unknown,
  db?: CatalogDb,
): Promise<CatalogWrite<{ id: string; stageId: string; skillSlug: string }>> {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const data = parsed.data;

  return withDb(db, async (tx) => {
    const stage = await tx.roadmapStage.findUnique({
      where: { id: data.stageId },
      select: { id: true, skill: { select: { slug: true } } },
    });
    if (!stage) return { ok: false, error: "Choose a stage that exists." };

    const fields = defined({
      type: data.type,
      url: data.url,
      title: data.title,
      description: data.description,
      keyPoints: data.keyPoints,
      transcript: data.transcript,
      provider: data.provider,
      author: data.author,
      videoId: data.videoId,
      isFree: data.isFree,
      language: data.language,
      sourceStatus: data.sourceStatus,
      needsReview: data.needsReview,
      lastVerifiedAt: data.lastVerifiedAt,
      order: data.order,
    });

    const incoming: Partial<ResourceTags> = {};
    if (data.durationMinutes !== undefined) incoming.durationMinutes = data.durationMinutes;
    if (data.depth !== undefined) incoming.depth = data.depth;
    if (data.isCore !== undefined) incoming.isCore = data.isCore;
    if (data.captionLanguages !== undefined) incoming.captionLanguages = data.captionLanguages;
    const source = data.tagSource ?? "admin";

    try {
      if (data.id) {
        const existing = await tx.resource.findUnique({ where: { id: data.id }, select: { id: true, stageId: true } });
        if (!existing || existing.stageId !== stage.id) {
          return { ok: false, error: "That resource is no longer on this stage." };
        }
        if (Object.keys(incoming).length > 0) {
          const current = await tx.resource.findUnique({
            where: { id: existing.id },
            select: { durationMinutes: true, depth: true, isCore: true, captionLanguages: true, tagOrigins: true },
          });
          if (current) {
            const merged = mergeResourceTags(
              {
                durationMinutes: current.durationMinutes,
                depth: current.depth,
                isCore: current.isCore,
                captionLanguages: current.captionLanguages,
              },
              readTagOrigins(current.tagOrigins),
              incoming,
              source,
            );
            Object.assign(fields, { ...merged.tags, tagOrigins: merged.origins });
          }
        }
        const resource = await tx.resource.update({
          where: { id: existing.id },
          data: fields,
          select: { id: true },
        });
        return { ok: true, data: { id: resource.id, stageId: stage.id, skillSlug: stage.skill.slug } };
      }

      const existing = await tx.resource.findUnique({
        where: { stageId_url: { stageId: stage.id, url: data.url } },
        select: { id: true },
      });
      if (existing) {
        if (Object.keys(incoming).length > 0) {
          const current = await tx.resource.findUnique({
            where: { id: existing.id },
            select: { durationMinutes: true, depth: true, isCore: true, captionLanguages: true, tagOrigins: true },
          });
          if (current) {
            const merged = mergeResourceTags(
              {
                durationMinutes: current.durationMinutes,
                depth: current.depth,
                isCore: current.isCore,
                captionLanguages: current.captionLanguages,
              },
              readTagOrigins(current.tagOrigins),
              incoming,
              source,
            );
            Object.assign(fields, { ...merged.tags, tagOrigins: merged.origins });
          }
        }
        const resource = await tx.resource.update({
          where: { id: existing.id },
          data: fields,
          select: { id: true },
        });
        return { ok: true, data: { id: resource.id, stageId: stage.id, skillSlug: stage.skill.slug } };
      }

      const last = await tx.resource.findFirst({
        where: { stageId: stage.id },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const resource = await tx.resource.create({
        data: {
          stageId: stage.id,
          type: data.type,
          url: data.url,
          title: data.title,
          description: data.description ?? null,
          keyPoints: data.keyPoints ?? [],
          transcript: data.transcript ?? null,
          provider: data.provider ?? "",
          author: data.author ?? null,
          videoId: data.videoId ?? null,
          isFree: data.isFree ?? true,
          language: data.language ?? "en",
          sourceStatus: data.sourceStatus ?? "ACTIVE",
          needsReview: data.needsReview ?? false,
          lastVerifiedAt: data.lastVerifiedAt ?? null,
          order: data.order ?? (last?.order ?? 0) + 1,
          durationMinutes: incoming.durationMinutes ?? null,
          depth: incoming.depth ?? null,
          isCore: incoming.isCore ?? false,
          captionLanguages: incoming.captionLanguages ?? [],
          tagOrigins: Object.fromEntries(Object.keys(incoming).map((field) => [field, source])),
        },
        select: { id: true },
      });
      return { ok: true, data: { id: resource.id, stageId: stage.id, skillSlug: stage.skill.slug } };
    } catch (error) {
      const message = uniqueMessage(error);
      if (message) return { ok: false, error: message };
      throw error;
    }
  });
}

export async function deleteResource(input: unknown, db?: CatalogDb): Promise<CatalogWrite<{ id: string }>> {
  const parsed = deleteByIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  try {
    await client(db).resource.delete({ where: { id: parsed.data.id } });
    return { ok: true, data: { id: parsed.data.id } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "That resource is no longer there." };
    }
    throw error;
  }
}

export async function reorderResources(input: unknown, db?: CatalogDb): Promise<CatalogWrite<{ resourceIds: string[] }>> {
  const parsed = reorderResourcesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { stageId, resourceIds } = parsed.data;
  if (new Set(resourceIds).size !== resourceIds.length) return { ok: false, error: "Each resource can appear only once." };

  return withDb(db, async (tx) => {
    const resources = await tx.resource.findMany({ where: { stageId }, select: { id: true } });
    const current = new Set(resources.map((resource) => resource.id));
    if (current.size !== resourceIds.length || resourceIds.some((id) => !current.has(id))) {
      return { ok: false, error: "Reorder the resources that are on this stage." };
    }
    for (let index = 0; index < resourceIds.length; index += 1) {
      await tx.resource.update({ where: { id: resourceIds[index] }, data: { order: -(index + 1) } });
    }
    for (let index = 0; index < resourceIds.length; index += 1) {
      await tx.resource.update({ where: { id: resourceIds[index] }, data: { order: index + 1 } });
    }
    return { ok: true, data: { resourceIds } };
  });
}

export async function upsertExplainBackPrompt(input: unknown, db?: CatalogDb): Promise<CatalogWrite<{ id: string; stageId: string }>> {
  const parsed = explainBackPromptSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const data = parsed.data;

  return withDb(db, async (tx) => {
    const stage = await tx.roadmapStage.findUnique({ where: { id: data.stageId }, select: { id: true } });
    if (!stage) return { ok: false, error: "Choose a stage that exists." };
    const prompt = await tx.explainBackPrompt.upsert({
      where: { stageId: stage.id },
      create: { stageId: stage.id, question: data.question, rubric: data.rubric },
      update: { question: data.question, rubric: data.rubric },
      select: { id: true, stageId: true },
    });
    return { ok: true, data: prompt };
  });
}
