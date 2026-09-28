import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { acceptedExplanations, explainNeedsWork, explainSamples, findExplainPrompt, findStage, listStages } from "@/lib/mock/catalog";
import type { MilestoneData } from "@/lib/types/pages";

export async function getMilestone(stageId: string): Promise<MilestoneData | null> {
  await devDelay();
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
  const sample = explainSamples[stage.id];
  return {
    kind: "open",
    skill,
    stage,
    prompt,
    passedSampleFeedback: sample?.feedback ?? "",
    needsWorkFeedback: explainNeedsWork.feedback,
    followUpQuestion: sample?.followUpQuestion ?? explainNeedsWork.followUpQuestion,
    followUpQuote: sample?.followUpQuote ?? explainNeedsWork.followUpQuote,
  };
}
