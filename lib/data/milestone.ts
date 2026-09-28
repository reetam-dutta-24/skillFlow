import "server-only";
import { cache } from "react";
import { EXPLAIN_INPUT_PREVIEW_STAGE_ID } from "@/lib/mock/config";
import { devDelay } from "@/lib/mock/delay";
import { acceptedExplanations, explainNeedsWork, explainSamples, findExplainPrompt, findStage, listStages } from "@/lib/mock/catalog";
import type { MilestoneData } from "@/lib/types/pages";

function openMilestone(stageId: string): MilestoneData | null {
  const found = findStage(stageId);
  const prompt = findExplainPrompt(stageId);
  if (!found || !prompt) return null;
  const sample = explainSamples[stageId];
  return {
    kind: "open",
    skill: found.skill,
    stage: found.stage,
    prompt,
    passedSampleFeedback: sample?.feedback ?? "",
    needsWorkFeedback: explainNeedsWork.feedback,
    followUpQuestion: sample?.followUpQuestion ?? explainNeedsWork.followUpQuestion,
    followUpQuote: sample?.followUpQuote ?? explainNeedsWork.followUpQuote,
  };
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
  if (!stage.quizPassed) {
    return { kind: "quiz_required", quizHref: `/quiz/${stage.id}`, skillName: skill.name, stageTitle: stage.title };
  }
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
