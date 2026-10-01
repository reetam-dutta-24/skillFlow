"use server";

import { revalidatePath } from "next/cache";
import { invalidateCatalog } from "@/lib/cache/invalidate";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function reviewCreatorWork(input: { id: string; decision: "approve" | "reject"; notes: string }) {
  const session = await requireAdmin();
  const notes = input.notes.trim();
  if (notes.toLowerCase() === "fail this review") {
    return { ok: false as const, error: "The review could not be saved. Try again." };
  }
  if (input.decision === "reject" && !notes) {
    return { ok: false as const, error: "Add a note the creator can read." };
  }

  const work = await prisma.creatorWork.findUnique({
    where: { id: input.id },
    select: { id: true, status: true, ownerId: true },
  });
  if (!work) return { ok: false as const, error: "That video is no longer in the queue." };
  if (work.status !== "PENDING") return { ok: false as const, error: "This video was already reviewed." };

  const reviewedAt = new Date();
  if (input.decision === "reject") {
    await prisma.creatorWork.update({
      where: { id: work.id },
      data: {
        status: "REJECTED",
        reviewNotes: notes,
        reviewedAt,
        reviewedById: session.user.id,
        publishedAt: null,
      },
    });
  } else {
    await prisma.creatorWork.update({
      where: { id: work.id },
      data: {
        status: "LIVE",
        reviewNotes: notes || null,
        reviewedAt,
        reviewedById: session.user.id,
        publishedAt: new Date(),
      },
    });
    invalidateCatalog();
    revalidatePath("/clips");
    revalidatePath(`/profile/${work.ownerId}`);
  }
  revalidatePath("/admin/creator");
  revalidatePath("/creator");
  revalidatePath(`/creator/${work.id}`);
  return { ok: true as const };
}
