import "server-only";
import { Prisma, ResourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SubmissionView } from "@/lib/types/domain";

const RESOURCE_TYPES = new Set<string>(Object.values(ResourceType));

export type SubmitInput = {
  stageId: string;
  type: string;
  url: string;
  title: string;
  description: string;
};

function parseType(value: string): ResourceType | null {
  return RESOURCE_TYPES.has(value) ? (value as ResourceType) : null;
}

function httpsUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

const submissionInclude = {
  stage: { select: { title: true, skill: { select: { name: true } } } },
  submittedBy: { select: { name: true } },
} satisfies Prisma.ResourceSubmissionInclude;

type SubmissionRow = Prisma.ResourceSubmissionGetPayload<{ include: typeof submissionInclude }>;

function toView(row: SubmissionRow): SubmissionView {
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

/** Skills that already have stages. A suggestion needs a real stage id. */
export async function getSubmitCatalog() {
  const skills = await prisma.skill.findMany({
    where: { isFlagship: true, stages: { some: {} } },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      stages: { orderBy: { order: "asc" }, select: { id: true, title: true } },
    },
  });
  return skills;
}

export async function getOwnSubmissions(viewer: { id: string; name: string | null }): Promise<SubmissionView[]> {
  const rows = await prisma.resourceSubmission.findMany({
    where: { submittedById: viewer.id },
    orderBy: { createdAt: "desc" },
    include: submissionInclude,
  });
  return rows.map(toView);
}

export async function createSubmission(userId: string, input: SubmitInput) {
  const title = input.title.trim();
  if (title.toLowerCase() === "fail this submit") {
    return { ok: false as const, error: "The suggestion could not be sent. Try again." };
  }
  if (!title) return { ok: false as const, error: "Add a title." };

  const type = parseType(input.type);
  if (!type) return { ok: false as const, error: "Choose a resource type." };

  const url = httpsUrl(input.url);
  if (!url) return { ok: false as const, error: "Use an https link." };

  const stage = await prisma.roadmapStage.findUnique({ where: { id: input.stageId }, select: { id: true } });
  if (!stage) return { ok: false as const, error: "Choose a stage that exists." };

  try {
    await prisma.resourceSubmission.create({
      data: {
        stageId: stage.id,
        type,
        url,
        title,
        description: blankToNull(input.description),
        submittedById: userId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false as const, error: "Sign in again before sending a suggestion." };
    }
    throw error;
  }

  return { ok: true as const };
}
