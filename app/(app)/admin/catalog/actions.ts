"use server";

import { revalidatePath } from "next/cache";
import { invalidateCatalog } from "@/lib/cache/invalidate";
import { prepareCatalogSkill, type CatalogSkillInput } from "@/lib/catalog-skill";
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
import { deleteResource, reorderResources, reorderStages, setSkillStatus, upsertSkill } from "@/lib/services/catalog";

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

export async function updateSkillStatus(input: { skillId: string; status: "AVAILABLE" | "COMING_SOON" }) {
  await requireAdmin();
  const saved = await setSkillStatus(input);
  if (!saved.ok) return saved;
  await revalidateSkill(saved.data.id);
  return { ok: true as const, status: saved.data.status };
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
