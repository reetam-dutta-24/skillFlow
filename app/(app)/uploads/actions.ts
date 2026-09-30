"use server";

import { auth } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";

export async function uploadLocalFile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in to continue." };
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false as const, error: "Choose a file." };
  return saveUploadedFile(file, String(formData.get("kind") ?? "any"));
}
