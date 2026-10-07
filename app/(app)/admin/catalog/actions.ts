"use server";

import { revalidatePath } from "next/cache";
import { invalidateCatalog } from "@/lib/cache/invalidate";
import { prepareCatalogSkill, storeSkillImage, type CatalogSkillInput } from "@/lib/catalog-skill";
import { isFreePath } from "@/lib/niches/tiers";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import {
  markCatalogResourceReviewed,
  recheckCatalogResource,
  saveCatalogResource,
  saveCatalogStage,
  type CatalogSaveInput,
  type StageSaveInput,
} from "@/lib/data/catalog-admin";
import { deleteResource, deleteStage, reorderResources, reorderStages, upsertSkill } from "@/lib/services/catalog";

async function revalidateStage(stageId: string) {
  const stage = await prisma.roadmapStage.findUnique({
    where: { id: stageId },
    select: { skill: { select: { slug: true } } },
  });
  revalidatePath("/admin/catalog");
  revalidatePath("/roadmap");
  revalidatePath(`/lesson/${stageId}`);
  if (stage) revalidatePath(`/roadmap/${stage.skill.slug}`);
  invalidateCatalog();
}

async function revalidateSkill(skillId: string) {
  const skill = await prisma.skill.findUnique({ where: { id: skillId }, select: { slug: true } });
  revalidatePath("/admin/catalog");
  revalidatePath("/skills");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/roadmap");
  if (skill) revalidatePath(`/roadmap/${skill.slug}`);
  invalidateCatalog();
}

export async function saveResource(input: CatalogSaveInput) {
  await requireAdmin();
  const result = await saveCatalogResource(input);
  if (result.ok) {
    revalidatePath("/roadmap");
    revalidatePath(result.roadmapHref);
    revalidatePath(result.lessonHref);
    revalidatePath("/admin/catalog");
    invalidateCatalog();
  }
  return result;
}

export async function createSkill(input: CatalogSkillInput) {
  await requireAdmin();
  const ready = await prepareCatalogSkill(input);
  if (!ready.ok) return ready;
  const saved = await upsertSkill(ready.skill);
  if (!saved.ok) return saved;
  revalidatePath("/admin/catalog");
  revalidatePath("/skills");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/roadmap");
  invalidateCatalog();
  return { ok: true as const, id: saved.data.id, slug: saved.data.slug };
}

export async function saveStage(input: StageSaveInput) {
  await requireAdmin();
  const saved = await saveCatalogStage(input);
  if (!saved.ok) return saved;
  await revalidateSkill(input.skillId);
  return saved;
}

export async function moveStages(input: { skillId: string; stageIds: string[] }) {
  await requireAdmin();
  const saved = await reorderStages(input);
  if (!saved.ok) return saved;
  await revalidateSkill(input.skillId);
  return { ok: true as const };
}

export async function moveResources(input: { stageId: string; resourceIds: string[] }) {
  await requireAdmin();
  const saved = await reorderResources(input);
  if (!saved.ok) return saved;
  await revalidateStage(input.stageId);
  return { ok: true as const };
}

export async function removeResource(input: { id: string; stageId: string }) {
  await requireAdmin();
  const saved = await deleteResource({ id: input.id });
  if (!saved.ok) return saved;
  await revalidateStage(input.stageId);
  return { ok: true as const };
}

export async function markReviewed(input: { id: string; stageId: string }) {
  await requireAdmin();
  const saved = await markCatalogResourceReviewed(input.id);
  if (!saved.ok) return saved;
  await revalidateStage(input.stageId);
  return { ok: true as const };
}

export async function recheckLink(input: { id: string; stageId: string }) {
  await requireAdmin();
  const saved = await recheckCatalogResource(input.id);
  if (!saved.ok) return saved;
  await revalidateStage(input.stageId);
  return saved;
}

export async function suggestTags(resourceId: string) {
  await requireAdmin();
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { title: true, description: true, keyPoints: true },
  });
  if (!resource) return { ok: false as const, error: "That resource is no longer there." };
  const { suggestResourceTags } = await import("@/lib/plan/suggest");
  const suggestion = await suggestResourceTags({
    title: resource.title,
    description: resource.description ?? "",
    keyPoints: resource.keyPoints.join("\n"),
  });
  if (!suggestion) return { ok: false as const, error: "A suggestion did not come back. Try again." };
  return { ok: true as const, suggestion };
}

/** Edit a niche's name, description, photo, status, and flagship flag. The slug never changes: links depend on it. */
export async function updateNiche(input: {
  id: string;
  name: string;
  description: string;
  image: string;
  status: "AVAILABLE" | "COMING_SOON";
  isFlagship: boolean;
}) {
  await requireAdmin();
  const skill = await prisma.skill.findUnique({ where: { id: input.id }, select: { id: true, slug: true, image: true } });
  if (!skill) return { ok: false as const, error: "That niche is no longer there." };
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Add a name." };
  if (name.length > 80) return { ok: false as const, error: "Keep the name under 80 characters." };
  let image = skill.image;
  if (input.image.trim() && input.image.trim() !== skill.image) {
    const stored = await storeSkillImage(skill.slug, input.image);
    if (!stored) return { ok: false as const, error: "Upload an image from your device, or use an https link." };
    image = stored;
  }
  const saved = await upsertSkill({
    name,
    slug: skill.slug,
    description: input.description.trim(),
    image,
    status: input.status,
    isFlagship: input.isFlagship,
  });
  if (!saved.ok) return saved;
  await revalidateSkill(skill.id);
  return { ok: true as const };
}

/**
 * Delete a niche. Everything tied to a niche is deleted with it in the database (follows, progress, notes, posts, videos,
 * events), so this only runs on an empty Premium niche. Anything else is refused with the reason.
 */
export async function deleteNiche(input: { id: string }) {
  await requireAdmin();
  const skill = await prisma.skill.findUnique({
    where: { id: input.id },
    select: {
      slug: true,
      _count: { select: { stages: true, userProgress: true, communityContributions: true } },
    },
  });
  if (!skill) return { ok: false as const, error: "That niche is no longer there." };
  if (isFreePath(skill.slug)) return { ok: false as const, error: "Free paths cannot be deleted. Set it to Coming soon to hide it." };
  const [videos, events] = await Promise.all([
    prisma.creatorWork.count({ where: { skillId: input.id } }),
    prisma.event.count({ where: { skillId: input.id } }),
  ]);
  const blockers = [
    skill._count.stages ? `${skill._count.stages} stages` : "",
    skill._count.userProgress ? `${skill._count.userProgress} followers` : "",
    skill._count.communityContributions ? `${skill._count.communityContributions} Open Source contributions` : "",
    videos ? `${videos} creator videos` : "",
    events ? `${events} events` : "",
  ].filter(Boolean);
  if (blockers.length) {
    return { ok: false as const, error: `This niche still has ${blockers.join(", ")}. Deleting it would erase them. Set it to Coming soon instead.` };
  }
  await prisma.skill.delete({ where: { id: input.id } });
  revalidatePath("/admin/catalog");
  revalidatePath("/skills");
  revalidatePath("/dashboard");
  revalidatePath("/roadmap");
  invalidateCatalog();
  return { ok: true as const };
}

/** Add a stage at the end of a niche's path, with its explain-back. */
export async function createStage(input: Omit<StageSaveInput, "order">) {
  await requireAdmin();
  const last = await prisma.roadmapStage.findFirst({ where: { skillId: input.skillId }, orderBy: { order: "desc" }, select: { order: true } });
  const saved = await saveCatalogStage({ ...input, order: (last?.order ?? 0) + 1 });
  if (!saved.ok) return saved;
  await revalidateSkill(input.skillId);
  return saved;
}

/**
 * Delete a stage and its resources. Refused when any learner has passed it, attempted its explain-back, or kept a
 * note from it, because those records would be deleted with it. The remaining stages are renumbered.
 */
export async function removeStage(input: { id: string }) {
  await requireAdmin();
  const stage = await prisma.roadmapStage.findUnique({ where: { id: input.id }, select: { id: true, skillId: true } });
  if (!stage) return { ok: false as const, error: "That stage is no longer there." };
  const [completions, attempts, notes] = await Promise.all([
    prisma.stageCompletion.count({ where: { stageId: stage.id } }),
    prisma.explainBackAttempt.count({ where: { prompt: { stageId: stage.id } } }),
    prisma.learnerNote.count({ where: { stageId: stage.id } }),
  ]);
  if (completions + attempts + notes > 0) {
    return {
      ok: false as const,
      error: "Learners have already worked on this stage (passes, explain-back attempts, or notes). Deleting it would erase their record, so edit it instead.",
    };
  }
  const deleted = await deleteStage({ id: stage.id });
  if (!deleted.ok) return deleted;
  const remaining = await prisma.roadmapStage.findMany({ where: { skillId: stage.skillId }, orderBy: { order: "asc" }, select: { id: true } });
  if (remaining.length) await reorderStages({ skillId: stage.skillId, stageIds: remaining.map((row) => row.id) });
  await revalidateSkill(stage.skillId);
  return { ok: true as const };
}
