"use server";

import { revalidatePath } from "next/cache";
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
