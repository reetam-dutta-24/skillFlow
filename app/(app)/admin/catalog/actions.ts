"use server";

import { revalidatePath } from "next/cache";
import { createCatalogSkill, type CatalogSkillInput } from "@/lib/catalog-skill";
import { requireAdmin } from "@/lib/require-admin";
import { saveCatalogResource, type CatalogSaveInput } from "@/lib/data/catalog-admin";

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
  const result = await createCatalogSkill(input);
  if (result.ok) {
    revalidatePath("/admin/catalog");
    revalidatePath("/skills");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/roadmap");
  }
  return result;
}
