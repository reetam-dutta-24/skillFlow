import "server-only";
import { cache } from "react";
import { EXPLAIN_INPUT_PREVIEW_STAGE_ID, EXPLAIN_NEEDS_WORK_PHRASE, EXPLAIN_REVIEW_FAILURE_TEXT } from "@/lib/mock/config";
import { devDelay } from "@/lib/mock/delay";
import { acceptedExplanations, explainNeedsWork, explainSamples, findExplainPrompt, findStage, listStages } from "@/lib/mock/catalog";
import { explainQuestion } from "@/lib/explain/concepts";
import { conceptsForGate } from "@/lib/explain/gate-concepts";
import { ensureGateConcepts } from "@/lib/explain/gate-store";
import { reviewStoredExplanation } from "@/lib/explain/review";
import { prisma } from "@/lib/prisma";
import type { RoadmapStageView, SkillView } from "@/lib/types/domain";
import type { ExplainReview, MilestoneData } from "@/lib/types/pages";

const REVIEW_MS = 600;

function continuation(skillId: string, order: number, slug: string) {
  const next = listStages(skillId).find((item) => item.order === order + 1);
  if (!next) return { continueHref: `/roadmap/${slug}`, continueLabel: "Continue to the roadmap" };
  return { continueHref: `/lesson/${next.id}`, continueLabel: `Continue to ${next.title}` };
}

function quoteFrom(answer: string, preferred: string) {
  const trimmed = answer.trim().replace(/\s+/g, " ");
  if (trimmed.toLowerCase().includes(preferred.toLowerCase())) return preferred;
  const sentence = trimmed.split(/(?<=[.!?])\s/)[0] ?? trimmed;
  if (sentence.length <= 140) return sentence;
  return `${sentence.slice(0, 137).trimEnd()}...`;
}

function openMilestone(stageId: string): MilestoneData | null {
  const found = findStage(stageId);
  const prompt = findExplainPrompt(stageId);
  if (!found || !prompt) return null;
  const sample = explainSamples[stageId];
  const next = continuation(found.skill.id, found.stage.order, found.skill.slug);
  return {
    kind: "open",
    skill: found.skill,
    stage: found.stage,
    prompt,
    passedSampleFeedback: sample?.feedback ?? "",
    needsWorkFeedback: explainNeedsWork.feedback,
    followUpQuestion: sample?.followUpQuestion ?? explainNeedsWork.followUpQuestion,
    followUpQuote: sample?.followUpQuote ?? explainNeedsWork.followUpQuote,
    continueHref: next.continueHref,
    continueLabel: next.continueLabel,
    concepts: [],
  };
}

const LOCKED_TAIL = 3;

function openLimit(stageCount: number) {
  if (stageCount <= 1) return stageCount;
  return Math.max(1, stageCount - LOCKED_TAIL);
}

/** A real stage reads the stored prompt. The preview id still uses the mock walkthrough. */
async function loadStoredMilestone(stageId: string, userId?: string): Promise<MilestoneData | null> {
  await ensureGateConcepts(stageId);
  const stage = await prisma.roadmapStage.findUnique({
    where: { id: stageId },
    include: {
      skill: true,
      explainBackPrompt: true,
      resources: { select: { id: true } },
    },
  });
  if (!stage?.explainBackPrompt) return null;

  const stageCount = await prisma.roadmapStage.count({ where: { skillId: stage.skillId } });
  const previous = await prisma.roadmapStage.findFirst({
    where: { skillId: stage.skillId, order: stage.order - 1 },
    select: { title: true },
  });
  const next = await prisma.roadmapStage.findFirst({
    where: { skillId: stage.skillId, order: stage.order + 1 },
    select: { id: true, title: true, order: true, monetized: true },
  });

  const skill: SkillView = {
    id: stage.skill.id,
    slug: stage.skill.slug,
    name: stage.skill.name,
    description: stage.skill.description,
    image: stage.skill.image,
    isFlagship: stage.skill.isFlagship,
    order: stage.skill.order,
    status: stage.skill.status === "AVAILABLE" ? "available" : "coming_soon",
    offer: stage.skill.offer,
    followed: false,
    masteryPercent: 0,
    createdAt: stage.skill.createdAt.toISOString(),
  };
  const limit = openLimit(stageCount);
  const open =
    stage.skill.status === "AVAILABLE" &&
    stage.skill.offer === "FREE" &&
    !stage.monetized &&
    stage.order <= limit;
  if (!open) return { kind: "locked", skillSlug: skill.slug };

  const earlier = await prisma.roadmapStage.findMany({
    where: { skillId: stage.skillId, monetized: false, order: { lt: stage.order, lte: limit } },
    select: { id: true },
  });
  if (earlier.length > 0) {
    const already = userId
      ? await prisma.stageCompletion.findUnique({
          where: { userId_stageId: { userId, stageId: stage.id } },
          select: { explainBackPassed: true },
        })
      : null;
    if (!already?.explainBackPassed) {
      const passed = userId
        ? await prisma.stageCompletion.count({
            where: { userId, explainBackPassed: true, stageId: { in: earlier.map((item) => item.id) } },
          })
        : 0;
      if (passed < earlier.length) return { kind: "locked", skillSlug: skill.slug };
    }
  }

  const view: RoadmapStageView = {
    id: stage.id,
    skillId: stage.skillId,
    title: stage.title,
    description: stage.description,
    image: stage.image,
    order: stage.order,
    status: "ready",
    masteryPercent: 0,
    lessonCount: stage.resources.length,
    hasExplainBack: true,
    explainBackPassed: false,
    previousStageTitle: previous?.title ?? null,
  };
  const generated = Boolean(stage.explainBackPrompt.conceptSourceHash);
  const concepts = conceptsForGate(stage.learningObjectives, stage.explainBackPrompt.rubric, generated);
  const prompt = {
    id: stage.explainBackPrompt.id,
    stageId: stage.id,
    version: stage.explainBackPrompt.version,
    question: concepts.length > 0 ? explainQuestion(stage.title) : stage.explainBackPrompt.question,
    rubric: stage.explainBackPrompt.rubric,
  };
  const nextOpen =
    next &&
    stage.skill.status === "AVAILABLE" &&
    stage.skill.offer === "FREE" &&
    !next.monetized &&
    next.order <= limit;
  const continueHref = nextOpen ? `/lesson/${next.id}` : `/roadmap/${skill.slug}`;
  const continueLabel = nextOpen ? `Continue to ${next.title}` : "Continue to the roadmap";

  if (userId) {
    const completion = await prisma.stageCompletion.findUnique({
      where: { userId_stageId: { userId, stageId: stage.id } },
      select: { explainBackPassed: true },
    });
    if (completion?.explainBackPassed) {
      const attempt = await prisma.explainBackAttempt.findFirst({
        where: { userId, promptId: prompt.id, verdict: "PASSED" },
        orderBy: { createdAt: "desc" },
        select: { initialExplanation: true },
      });
      return {
        kind: "passed",
        skill,
        stage: { ...view, status: "passed", explainBackPassed: true },
        prompt,
        acceptedExplanation: attempt?.initialExplanation ?? "",
        continueHref,
      };
    }
  }

  return {
    kind: "open",
    skill,
    stage: view,
    prompt,
    passedSampleFeedback: "",
    needsWorkFeedback: "",
    followUpQuestion: "",
    followUpQuote: "",
    continueHref,
    continueLabel,
    concepts,
  };
}

export async function reviewMilestone(input: {
  stageId: string;
  answer: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
  userId?: string;
}): Promise<ExplainReview> {
  if (input.stageId !== EXPLAIN_INPUT_PREVIEW_STAGE_ID && !findStage(input.stageId)) {
    if (!input.userId) return { ok: false, error: "unavailable" };
    return reviewStoredExplanation({
      userId: input.userId,
      stageId: input.stageId,
      answer: input.answer,
      followUpQuestion: input.followUpQuestion,
      followUpAnswer: input.followUpAnswer,
    });
  }
  await new Promise((resolve) => setTimeout(resolve, REVIEW_MS));
  const answer = input.answer.trim();
  const followUpAnswer = input.followUpAnswer?.trim() ?? "";
  if (!answer || (input.followUpAnswer !== undefined && !followUpAnswer)) return { ok: false, error: "empty" };
  const failure = EXPLAIN_REVIEW_FAILURE_TEXT.toLowerCase();
  if (answer.toLowerCase() === failure || followUpAnswer.toLowerCase() === failure) return { ok: false, error: "unavailable" };
  const needsWork = answer.toLowerCase().includes(EXPLAIN_NEEDS_WORK_PHRASE.toLowerCase());
  const sample = needsWork ? explainNeedsWork : (explainSamples[input.stageId] ?? explainNeedsWork);
  if (input.followUpAnswer === undefined) {
    return { ok: true, kind: "follow-up", question: sample.followUpQuestion, quote: quoteFrom(answer, sample.followUpQuote) };
  }
  return sample.verdict === "NEEDS_IMPROVEMENT"
    ? { ok: true, kind: "needs-improvement", feedback: sample.feedback }
    : { ok: true, kind: "pass", feedback: sample.feedback };
}

export const getMilestone = cache(async (stageId: string, userId?: string): Promise<MilestoneData | null> => {
  if (stageId !== EXPLAIN_INPUT_PREVIEW_STAGE_ID && !findStage(stageId)) {
    return loadStoredMilestone(stageId, userId);
  }
  await devDelay();
  if (stageId === EXPLAIN_INPUT_PREVIEW_STAGE_ID) return openMilestone("stage_fs_2");
  const found = findStage(stageId);
  if (!found) return null;
  const { skill, stage } = found;
  if (stage.status === "locked") return { kind: "locked", skillSlug: skill.slug };
  const prompt = findExplainPrompt(stage.id);
  if (!prompt) return null;
  if (stage.explainBackPassed) {
    const stages = listStages(skill.id);
    const next = stages.find((item) => item.order === stage.order + 1);
    return {
      kind: "passed",
      skill,
      stage,
      prompt,
      acceptedExplanation: acceptedExplanations[stage.id] ?? "",
      continueHref: next ? `/lesson/${next.id}` : `/roadmap/${skill.slug}`,
    };
  }
  return openMilestone(stage.id);
});
