"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { explainModelConfig, judgeRecall } from "@/lib/explain/judge";
import { EXPLAIN_REVIEW_FAILURE_TEXT } from "@/lib/mock/config";
import { prisma } from "@/lib/prisma";
import { touchLearnerProgress } from "@/lib/progress/stats";
import { qualityLabel, RECALL_HOLD_COOKIE, RECALL_LIMIT, recallDue, retentionFactor, type RecallQuality } from "@/lib/explain/recall";

export async function reviewRecall(noteId: string, answer: string): Promise<
  | { ok: true; quality: RecallQuality; review: string; label: string; retention: number; previous: number | null }
  | { ok: false; error: "empty" | "unavailable" | "unconnected" }
> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !noteId) return { ok: false, error: "unavailable" };
  if (!explainModelConfig()) return { ok: false, error: "unconnected" };

  const written = answer.trim().slice(0, 8000);
  if (!written) return { ok: false, error: "empty" };
  if (written.toLowerCase() === EXPLAIN_REVIEW_FAILURE_TEXT.toLowerCase()) return { ok: false, error: "unavailable" };

  const note = await prisma.learnerNote.findFirst({
    where: { id: noteId, userId, kind: "stage", stageId: { not: null } },
    include: {
      recallChecks: { orderBy: { createdAt: "asc" }, select: { createdAt: true } },
      stage: {
        select: {
          title: true,
          description: true,
          resources: { orderBy: { order: "asc" }, select: { keyPoints: true } },
        },
      },
    },
  });
  if (!note?.stage) return { ok: false, error: "unavailable" };
  if (!recallDue({ passedAt: note.createdAt, answeredAt: note.recallChecks.map((check) => check.createdAt), now: new Date() })) {
    return { ok: false, error: "unavailable" };
  }

  const siblings = await prisma.learnerNote.findMany({
    where: { userId, stageId: note.stageId, id: { not: note.id } },
    select: { concept: true },
    orderBy: { position: "asc" },
  });
  const points = note.stage.resources.flatMap((resource) => resource.keyPoints).map((point) => point.trim()).filter(Boolean).slice(0, 24);
  const review = await judgeRecall({
    title: note.stage.title,
    description: note.stage.description,
    concept: note.concept,
    others: siblings.map((item) => item.concept),
    notes: points,
    answer: written,
  });
  if (!review) return { ok: false, error: "unavailable" };

  const saved = await prisma.$transaction(async (tx) => {
    const count = await tx.recallCheck.count({ where: { noteId: note.id } });
    if (count >= RECALL_LIMIT) return null;
    return tx.recallCheck.create({
      data: {
        userId,
        noteId: note.id,
        answer: written,
        quality: review.quality,
        score: review.score,
        review: review.review,
      },
    });
  });
  if (!saved) return { ok: false, error: "unavailable" };

  const scores = await prisma.recallCheck.findMany({ where: { userId }, select: { id: true, score: true } });
  const retention = retentionFactor(scores.map((row) => row.score)) ?? review.score;
  const previous = retentionFactor(scores.filter((row) => row.id !== saved.id).map((row) => row.score));

  try {
    await touchLearnerProgress(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "progress update failed";
    console.error("learner progress update failed", message.slice(0, 180));
  }

  return { ok: true, quality: review.quality, review: review.review, label: qualityLabel(review.quality), retention, previous };
}

/** Hide the next recall until the browser closes, after the learner has read the review. */
export async function releaseRecall(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const jar = await cookies();
  jar.set(RECALL_HOLD_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/progress");
}
