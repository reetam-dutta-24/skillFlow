import "server-only";
import { cache } from "react";
import { devDelay } from "@/lib/mock/delay";
import { PREMIUM_PRICE_LABEL } from "@/lib/mock/config";
import { findSkill, listStages, passedMilestone } from "@/lib/mock/catalog";

export async function getUpgrade() {
  await devDelay();
  return { priceLabel: PREMIUM_PRICE_LABEL };
}

export const getTranscript = cache(async (skillSlug: string) => {
  await devDelay();
  const skill = findSkill(skillSlug);
  if (!skill) return null;
  const passed = listStages(skill.id).filter((stage) => stage.explainBackPassed);
  return {
    skill,
    milestones: passed.map((stage) => ({
      title: stage.title,
      explainBackPassedOn: stage.id === passedMilestone.stageId ? passedMilestone.explainBackPassedOn : "2026-08-04",
    })),
  };
});
