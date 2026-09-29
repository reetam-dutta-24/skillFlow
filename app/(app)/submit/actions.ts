"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createSubmission } from "@/lib/data/submissions";

export async function submitResource(input: {
  stageId: string;
  type: string;
  url: string;
  title: string;
  description: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in to continue." };

  const result = await createSubmission(session.user.id, input);
  if (result.ok) {
    revalidatePath("/submit");
    revalidatePath("/admin/submissions");
  }
  return result;
}
