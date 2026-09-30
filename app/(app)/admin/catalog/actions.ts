"use server";

import { revalidatePath } from "next/cache";
import { prepareCatalogSkill, type CatalogSkillInput } from "@/lib/catalog-skill";
import { requireAdmin } from "@/lib/require-admin";
import { saveCatalogResource, type CatalogSaveInput } from "@/lib/data/catalog-admin";
import { upsertSkill } from "@/lib/services/catalog";

export async function saveResource(input: CatalogSaveInput) {
  await requireAdmin();
  const result = await saveCatalogResource(input);
  if (result.ok) {
    revalidatePath("/roadmap");
    revalidatePath(result.roadmapHref);
    revalidatePath(result.lessonHref);
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
  return { ok: true as const, id: saved.data.id, slug: saved.data.slug };
}
