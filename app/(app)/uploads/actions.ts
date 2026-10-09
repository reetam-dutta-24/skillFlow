"use server";

import { auth } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";
import { uploadAllowed } from "@/lib/limits";

export async function uploadLocalFile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in to continue." };
  if (!(await uploadAllowed(session.user.id))) return { ok: false as const, error: "Too many uploads. Try again in an hour." };
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false as const, error: "Choose a file." };
  return saveUploadedFile(file, String(formData.get("kind") ?? "any"));
}
