import "server-only";
import { cache } from "react";
import { EXPLAIN_INPUT_PREVIEW_STAGE_ID, EXPLAIN_NEEDS_WORK_PHRASE, EXPLAIN_REVIEW_FAILURE_TEXT } from "@/lib/mock/config";
import { devDelay } from "@/lib/mock/delay";
import { acceptedExplanations, explainNeedsWork, explainSamples, findExplainPrompt, findStage, listStages } from "@/lib/mock/catalog";
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
  };
}

export async function reviewMilestone(input: {
  stageId: string;
  answer: string;
  followUpAnswer?: string;
}): Promise<ExplainReview> {
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

export const getMilestone = cache(async (stageId: string): Promise<MilestoneData | null> => {
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
