"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { invalidateCatalog } from "@/lib/cache/invalidate";
import { prisma } from "@/lib/prisma";
import type { CreatorWorkFormat, CreatorWorkStatus } from "@prisma/client";
import { saveUploadedFile } from "@/lib/uploads";

type SaveResult = { ok: true; id: string } | { ok: false; error: string };

const TITLE_LIMIT = 140;
const DESCRIPTION_LIMIT = 500;

function cleanText(value: FormDataEntryValue | null, limit: number) {
  return String(value ?? "").trim().slice(0, limit);
}

async function availableSkill(skillId: string) {
  return prisma.skill.findFirst({
    where: { id: skillId, status: "AVAILABLE" },
    select: { id: true },
  });
}

function formatOf(value: FormDataEntryValue | null): CreatorWorkFormat | null {
  if (value === "video") return "VIDEO";
  if (value === "short") return "SHORT";
  return null;
}

export async function saveCreatorWork(formData: FormData): Promise<SaveResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sign in again before saving." };

  const title = cleanText(formData.get("title"), TITLE_LIMIT);
  if (title.toLowerCase() === "fail this upload") {
    return { ok: false, error: "The video could not be saved. Try again." };
  }
  if (!title) return { ok: false, error: "Add a title." };

  const description = cleanText(formData.get("description"), DESCRIPTION_LIMIT);
  const format = formatOf(formData.get("format"));
  if (!format) return { ok: false, error: "Choose a short clip or a video." };

  const skill = await availableSkill(String(formData.get("skillId") ?? ""));
  if (!skill) return { ok: false, error: "Choose an open niche." };

  const rights = formData.get("rights") === "on";
  if (!rights) return { ok: false, error: "Confirm that you own this video." };

  const intent = formData.get("intent") === "review" ? "review" : "draft";
  const workId = String(formData.get("workId") ?? "");
  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;

  const existing = workId
    ? await prisma.creatorWork.findFirst({
        where: { id: workId, ownerId: session.user.id },
      })
    : null;
  if (workId && !existing) return { ok: false, error: "That video is not in your library." };
  if (existing?.status === "PENDING") return { ok: false, error: "Withdraw it from review before editing." };

  let mediaUrl = existing?.mediaUrl ?? "";
  let backToReview = false;
  if (hasFile) {
    const saved = await saveUploadedFile(file, "video");
    if (!saved.ok) return saved;
    mediaUrl = saved.url;
    backToReview = existing?.status === "LIVE";
  }
  if (!mediaUrl) return { ok: false, error: "Choose a video file." };

  const send = intent === "review" || backToReview;
  const status: CreatorWorkStatus = send ? "PENDING" : existing?.status === "LIVE" ? "LIVE" : "DRAFT";
  const data = {
    title,
    description,
    format,
    skillId: skill.id,
    mediaUrl,
    rightsConfirmed: true,
    status,
    submittedAt: send ? new Date() : existing?.submittedAt ?? null,
    reviewNotes: send ? null : existing?.reviewNotes ?? null,
    publishedAt: status === "LIVE" ? existing?.publishedAt ?? new Date() : null,
  };

  const saved = existing
    ? await prisma.creatorWork.update({ where: { id: existing.id }, data })
    : await prisma.creatorWork.create({ data: { ...data, ownerId: session.user.id } });

  if (existing?.status === "LIVE" || saved.status === "LIVE") {
    invalidateCatalog();
    revalidatePath("/clips");
    revalidatePath(`/profile/${session.user.id}`);
  }
  revalidatePath("/creator");
  revalidatePath(`/creator/${saved.id}`);
  return { ok: true, id: saved.id };
}

export async function withdrawCreatorWork(formData: FormData): Promise<SaveResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sign in again before saving." };
  const workId = String(formData.get("workId") ?? "");
  const existing = await prisma.creatorWork.findFirst({
    where: { id: workId, ownerId: session.user.id },
  });
  if (!existing) return { ok: false, error: "That video is not in your library." };
  if (existing.status !== "PENDING" && existing.status !== "LIVE") {
    return { ok: false, error: "Only a video in review or on the feed can be withdrawn." };
  }
  await prisma.creatorWork.update({
    where: { id: existing.id },
    data: { status: "DRAFT", publishedAt: null },
  });
  if (existing.status === "LIVE") {
    invalidateCatalog();
    revalidatePath("/clips");
    revalidatePath(`/profile/${session.user.id}`);
  }
  revalidatePath("/creator");
  revalidatePath(`/creator/${existing.id}`);
  revalidatePath("/admin/creator");
  return { ok: true, id: existing.id };
}

export async function deleteCreatorWork(formData: FormData): Promise<SaveResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sign in again before saving." };
  const workId = String(formData.get("workId") ?? "");
  const existing = await prisma.creatorWork.findFirst({
    where: { id: workId, ownerId: session.user.id },
  });
  if (!existing) return { ok: false, error: "That video is not in your library." };
  await prisma.creatorWork.delete({ where: { id: existing.id } });
  if (existing.status === "LIVE") {
    invalidateCatalog();
    revalidatePath("/clips");
    revalidatePath(`/profile/${session.user.id}`);
  }
  revalidatePath("/creator");
  return { ok: true, id: existing.id };
}

export async function recordCreatorWatch(input: {
  viewId: string;
  workId: string;
  watchedSec: number;
  durationSec: number;
  completed: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.viewId)) {
    return { ok: false as const };
  }
  const watchedSec = Math.max(0, Math.min(60 * 60 * 6, Math.floor(input.watchedSec)));
  const durationSec = Math.max(0, Math.min(60 * 60 * 6, Math.floor(input.durationSec)));
  const work = await prisma.creatorWork.findFirst({
    where: { id: input.workId, status: "LIVE" },
    select: { id: true, durationSec: true },
  });
  if (!work) return { ok: false as const };

  const existing = await prisma.creatorView.findUnique({ where: { id: input.viewId } });
  if (existing && existing.workId !== work.id) return { ok: false as const };
  const completed = Boolean(input.completed) || (durationSec > 0 && watchedSec >= durationSec * 0.9);
  if (!existing) {
    await prisma.creatorView.create({
      data: {
        id: input.viewId,
        workId: work.id,
        viewerId: session.user.id,
        watchedSec,
        completed,
      },
    });
  } else {
    await prisma.creatorView.update({
      where: { id: existing.id },
      data: {
        watchedSec: Math.max(existing.watchedSec, watchedSec),
        completed: existing.completed || completed,
      },
    });
  }
  if (durationSec > 0 && durationSec !== work.durationSec) {
    await prisma.creatorWork.update({ where: { id: work.id }, data: { durationSec } });
  }
  return { ok: true as const };
}
