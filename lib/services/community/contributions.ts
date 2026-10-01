import "server-only";
import { Prisma, type LinkCheckStatus } from "@prisma/client";
import { invalidateCommunity } from "@/lib/cache/invalidate";
import { checkCommunitySources } from "@/lib/links/check";
import { normalizeCommunityUrl } from "@/lib/links/normalize-url";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_LIMITS, limitMessage, limitReached } from "@/lib/services/community/limits";
import { fail, type ServiceFail } from "@/lib/services/community/result";
import { authorTransition } from "@/lib/services/community/transitions";
import { contributionSchema, issueOf, type ContributionInput } from "@/lib/validators/community";

type Step = { title: string; url?: string; note?: string };

type Prepared = {
  title: string;
  summary: string;
  body: string;
  imageUrl: string | null;
  sources: string[];
  normalizedUrl: string | null;
  tags: string[];
  steps: Step[] | null;
  linkStatus: LinkCheckStatus;
  linkCheckedAt: Date | null;
  /** Every link: sources and step links. */
  urls: string[];
  /** False on an edit that kept the same links. The link and duplicate checks were skipped. */
  linksChanged: boolean;
};

/** What an edit compares against, so unchanged links are not fetched again. */
type PreviousLinks = { urls: string[]; linkStatus: LinkCheckStatus; linkCheckedAt: Date | null };

export const STALE_EDIT = "This contribution changed since you opened it. Reload to see the latest version.";

class StaleEdit extends Error {}

const DAY_MS = 24 * 60 * 60 * 1000;

function summaryFrom(description: string): string {
  return description.length <= 280 ? description : `${description.slice(0, 277)}...`;
}

function cleanImage(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (trimmed.startsWith("/uploads/")) return trimmed;
  return normalizeCommunityUrl(trimmed);
}

function sameLinks(a: string[], b: string[]): boolean {
  const left = [...new Set(a)].sort();
  const right = [...new Set(b)].sort();
  return left.length === right.length && left.every((url, index) => url === right[index]);
}

/** Step links stored on a learning path. */
export function storedStepUrls(steps: unknown): string[] {
  if (!Array.isArray(steps)) return [];
  return steps.flatMap((step) => {
    if (!step || typeof step !== "object") return [];
    const url = (step as { url?: unknown }).url;
    return typeof url === "string" && url ? [url] : [];
  });
}

async function prepare(input: ContributionInput, previous?: PreviousLinks): Promise<Prepared | ServiceFail> {
  const sources: string[] = [];
  for (const source of input.sources) {
    const normalized = normalizeCommunityUrl(source);
    if (!normalized) return fail("Use an https link.", "sources");
    if (!sources.includes(normalized)) sources.push(normalized);
  }

  const steps: Step[] | null = input.steps
    ? input.steps.map((step) => {
        const url = step.url?.trim() ? normalizeCommunityUrl(step.url) ?? undefined : undefined;
        if (step.url?.trim() && !url) return { title: step.title, url: "", note: step.note };
        return { title: step.title, url, note: step.note?.trim() || undefined };
      })
    : null;
  if (steps?.some((step) => step.url === "")) return fail("Use an https link on each step.", "steps");

  const extra = (steps ?? []).flatMap((step) => (step.url ? [step.url] : []));
  const urls = [...sources, ...extra];
  const linksChanged = !previous || !sameLinks(urls, previous.urls);
  let linkStatus: LinkCheckStatus;
  let linkCheckedAt: Date | null;
  if (linksChanged || !previous) {
    const checked = await checkCommunitySources(urls);
    if (!checked.ok) return fail(checked.error, "sources");
    linkStatus = checked.linkStatus;
    linkCheckedAt = urls.length > 0 ? new Date() : null;
  } else {
    linkStatus = previous.linkStatus;
    linkCheckedAt = previous.linkCheckedAt;
  }

  return {
    title: input.title,
    summary: summaryFrom(input.description),
    body: input.description,
    imageUrl: cleanImage(input.imageUrl),
    sources,
    normalizedUrl: sources[0] ?? null,
    tags: [...new Set(input.tags ?? [])],
    steps,
    linkStatus,
    linkCheckedAt,
    urls,
    linksChanged,
  };
}

async function duplicateMessage(skillId: string, urls: string[], ignoreId?: string): Promise<ServiceFail | null> {
  if (urls.length === 0) return null;
  const community = await prisma.communityContribution.findFirst({
    where: {
      skillId,
      id: ignoreId ? { not: ignoreId } : undefined,
      OR: [{ normalizedUrl: { in: urls } }, { sources: { hasSome: urls } }],
    },
    select: { id: true },
  });
  if (community) return fail("That link is already in this community.", "sources");

  const official = await prisma.resource.findMany({
    where: { stage: { skillId } },
    select: { url: true },
  });
  const officialUrls = new Set(official.flatMap((row) => {
    const normalized = normalizeCommunityUrl(row.url);
    return normalized ? [normalized] : [];
  }));
  if (urls.some((url) => officialUrls.has(url))) return fail("Already in the official roadmap.", "sources");
  return null;
}

/** `keepGapId` is the gap an edited contribution already cites. It may be resolved or closed by now, and that is fine. */
async function skillContext(skillId: string, stageId?: string, gapId?: string, keepGapId?: string | null): Promise<ServiceFail | null> {
  const skill = await prisma.skill.findUnique({ where: { id: skillId }, select: { id: true, status: true } });
  if (!skill) return fail("Choose a niche that exists.", "skillId");
  if (stageId) {
    if (skill.status !== "AVAILABLE") return fail("Stages are only for an open path.", "stageId");
    const stage = await prisma.roadmapStage.findFirst({ where: { id: stageId, skillId }, select: { id: true } });
    if (!stage) return fail("That stage is not part of this niche.", "stageId");
  }
  if (gapId && gapId !== keepGapId) {
    const gap = await prisma.gapReport.findFirst({ where: { id: gapId, skillId, status: "OPEN" }, select: { id: true } });
    if (!gap) return fail("Choose an open gap in this niche.", "gapId");
  }
  return null;
}

/** Fields shared by create and edit. Left unannotated so it fits both the create and the update input. */
function writeData(input: ContributionInput, prepared: Prepared) {
  return {
    skillId: input.skillId,
    type: input.type,
    title: prepared.title,
    summary: prepared.summary,
    body: prepared.body,
    imageUrl: prepared.imageUrl,
    url: prepared.sources[0] ?? null,
    normalizedUrl: prepared.normalizedUrl,
    sources: prepared.sources,
    steps: prepared.steps === null ? Prisma.DbNull : (prepared.steps as Prisma.InputJsonValue),
    tags: prepared.tags,
    stageId: input.stageId ?? null,
    disclosure: input.disclosure,
    gapId: input.gapId ?? null,
    linkStatus: prepared.linkStatus,
    linkCheckedAt: prepared.linkCheckedAt,
  };
}

export async function createContribution(userId: string, raw: unknown) {
  const parsed = contributionSchema.safeParse(raw);
  if (!parsed.success) return fail(issueOf(parsed.error).error, issueOf(parsed.error).field);
  const input = parsed.data;

  const since = new Date(Date.now() - DAY_MS);
  const recent = await prisma.communityContribution.count({ where: { authorId: userId, createdAt: { gte: since } } });
  if (limitReached(recent, COMMUNITY_LIMITS.contributionsPerDay)) return fail(limitMessage("contributions"));

  const context = await skillContext(input.skillId, input.stageId, input.gapId);
  if (context) return context;

  const prepared = await prepare(input);
  if ("ok" in prepared) return prepared;

  const duplicate = await duplicateMessage(input.skillId, prepared.urls);
  if (duplicate) return duplicate;

  try {
    const row = await prisma.communityContribution.create({
      data: { ...writeData(input, prepared), authorId: userId, status: "OPEN", revision: 1 },
      select: { id: true, status: true },
    });
    return { ok: true as const, id: row.id, status: row.status };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("That link is already in this community.", "sources");
    }
    throw error;
  }
}

/**
 * The author edits. Open or changes-requested goes back to open. A merged one is resubmitted:
 * it leaves the public lists, and a gap it resolved opens again until it is merged again.
 */
export async function updateContribution(userId: string, contributionId: string, raw: unknown) {
  const parsed = contributionSchema.safeParse(raw);
  if (!parsed.success) return fail(issueOf(parsed.error).error, issueOf(parsed.error).field);
  const input = parsed.data;

  const current = await prisma.communityContribution.findUnique({
    where: { id: contributionId },
    select: {
      id: true,
      authorId: true,
      skillId: true,
      status: true,
      revision: true,
      gapId: true,
      sources: true,
      steps: true,
      linkStatus: true,
      linkCheckedAt: true,
      skill: { select: { slug: true } },
    },
  });
  if (!current || current.authorId !== userId) return fail("That contribution is not yours.");
  if (current.skillId !== input.skillId) return fail("Keep this contribution in the same community.", "skillId");

  const resubmitted = current.status === "MERGED";
  const moving = resubmitted ? authorTransition(current.status, "resubmit") : authorTransition(current.status, "edit");
  if (!moving.ok) return fail(moving.error);

  const context = await skillContext(input.skillId, input.stageId, input.gapId, current.gapId);
  if (context) return context;
  const prepared = await prepare(input, {
    urls: [...current.sources, ...storedStepUrls(current.steps)],
    linkStatus: current.linkStatus,
    linkCheckedAt: current.linkCheckedAt,
  });
  if ("ok" in prepared) return prepared;
  if (prepared.linksChanged) {
    const duplicate = await duplicateMessage(input.skillId, prepared.urls, current.id);
    if (duplicate) return duplicate;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Status and revision in the filter: a review decision that landed meanwhile makes this match nothing.
      const moved = await tx.communityContribution.updateMany({
        where: { id: current.id, status: current.status, revision: current.revision },
        data: { ...writeData(input, prepared), status: moving.status, revision: { increment: 1 } },
      });
      if (moved.count === 0) throw new StaleEdit();
      if (resubmitted) {
        await tx.gapReport.updateMany({
          where: { resolvedByContributionId: current.id },
          data: { status: "OPEN", resolvedByContributionId: null },
        });
      }
    });
  } catch (error) {
    if (error instanceof StaleEdit) return fail(STALE_EDIT);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("That link is already in this community.", "sources");
    }
    throw error;
  }

  // Only a resubmission changes what the public lists show.
  if (resubmitted) invalidateCommunity();
  return {
    ok: true as const,
    id: current.id,
    slug: current.skill.slug,
    status: moving.status,
    revision: current.revision + 1,
    resubmitted,
  };
}

/** The author closes an open contribution. No review row. Nothing public changes. */
export async function withdrawContribution(userId: string, contributionId: string) {
  const current = await prisma.communityContribution.findUnique({
    where: { id: contributionId },
    select: { id: true, authorId: true, status: true },
  });
  if (!current || current.authorId !== userId) return fail("That contribution is not yours.");
  const next = authorTransition(current.status, "withdraw");
  if (!next.ok) return fail(next.error);
  const moved = await prisma.communityContribution.updateMany({
    where: { id: current.id, authorId: userId, status: { in: ["OPEN", "CHANGES_REQUESTED"] } },
    data: { status: next.status },
  });
  if (moved.count === 0) return fail(STALE_EDIT);
  return { ok: true as const, id: current.id, status: next.status };
}

/** Detail for a contribution page. Author by name and avatar only, never email. */
export async function getContribution(id: string) {
  return prisma.communityContribution.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      summary: true,
      body: true,
      imageUrl: true,
      sources: true,
      url: true,
      steps: true,
      tags: true,
      disclosure: true,
      linkStatus: true,
      usefulCount: true,
      viewCount: true,
      revision: true,
      mergedAt: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { id: true, name: true, image: true } },
      skill: { select: { id: true, slug: true, name: true, status: true } },
      stage: { select: { id: true, order: true, title: true } },
      reviews: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          decision: true,
          reason: true,
          feedback: true,
          revision: true,
          unmerge: true,
          createdAt: true,
          reviewer: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });
}
