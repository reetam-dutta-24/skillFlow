import "server-only";
import { prisma } from "@/lib/prisma";
import type { SubmissionView } from "@/lib/types/domain";
import { Prisma } from "@prisma/client";

const submissionInclude = {
  stage: { select: { id: true, title: true, skill: { select: { name: true, slug: true } } } },
  submittedBy: { select: { name: true } },
} satisfies Prisma.ResourceSubmissionInclude;

type QueueRow = Prisma.ResourceSubmissionGetPayload<{ include: typeof submissionInclude }>;

function toView(row: QueueRow): SubmissionView {
  return {
    id: row.id,
    stageId: row.stageId,
    skillName: row.stage.skill.name,
    stageTitle: row.stage.title,
    type: row.type,
    url: row.url,
    title: row.title,
    description: row.description,
    status: row.status,
    reviewNotes: row.reviewNotes,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    submittedById: row.submittedById,
    submitterName: row.submittedBy.name?.trim() || "Learner",
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAdminQueue(): Promise<SubmissionView[]> {
  const rows = await prisma.resourceSubmission.findMany({
    orderBy: { createdAt: "desc" },
    include: submissionInclude,
  });
  return rows.map(toView);
}

export async function reviewSubmissionRecord(input: {
  id: string;
  reviewerId: string;
  decision: "approve" | "reject";
  notes: string;
}) {
  const notes = input.notes.trim();
  if (notes.toLowerCase() === "fail this review") {
    return { ok: false as const, error: "The review could not be saved. Try again." };
  }
  if (input.decision === "reject" && !notes) {
    return { ok: false as const, error: "Add a note the learner can read." };
  }

  const submission = await prisma.resourceSubmission.findUnique({
    where: { id: input.id },
    include: submissionInclude,
  });
  if (!submission) return { ok: false as const, error: "That suggestion is no longer in the queue." };
  if (submission.status !== "PENDING") {
    return { ok: false as const, error: "This suggestion was already reviewed." };
  }

  const reviewedAt = new Date();
  const paths = {
    lessonHref: `/lesson/${submission.stage.id}`,
    roadmapHref: `/roadmap/${submission.stage.skill.slug}`,
  };

  if (input.decision === "reject") {
    await prisma.resourceSubmission.update({
      where: { id: submission.id },
      data: {
        status: "REJECTED",
        reviewNotes: notes,
        reviewedAt,
        reviewedById: input.reviewerId,
      },
    });
    return { ok: true as const, ...paths };
  }

  let url: string;
  try {
    const parsed = new URL(submission.url);
    if (parsed.protocol !== "https:") return { ok: false as const, error: "This suggestion does not have an https link." };
    url = parsed.toString();
  } catch {
    return { ok: false as const, error: "This suggestion does not have an https link." };
  }

  await prisma.$transaction(async (tx) => {
    const last = await tx.resource.findFirst({
      where: { stageId: submission.stageId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    await tx.resource.create({
      data: {
        stageId: submission.stageId,
        type: submission.type,
        url,
        title: submission.title,
        description: submission.description,
        order: (last?.order ?? 0) + 1,
      },
    });
    await tx.resourceSubmission.update({
      where: { id: submission.id },
      data: {
        status: "APPROVED",
        reviewNotes: notes || null,
        reviewedAt,
        reviewedById: input.reviewerId,
      },
    });
  });

  return { ok: true as const, ...paths };
}
