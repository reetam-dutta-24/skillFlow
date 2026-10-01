import "server-only";
import { cache } from "react";
import { devDelay } from "@/lib/mock/delay";
import { PREMIUM_PRICE_LABEL } from "@/lib/mock/config";
import { findSkill, leaderboardWithViewer, listStages, noteSeeds, passedMilestone } from "@/lib/mock/catalog";

export async function getUpgrade() {
  await devDelay();
  return { priceLabel: PREMIUM_PRICE_LABEL };
}

export async function getLeaderboard(name: string | null) {
  await devDelay();
  return leaderboardWithViewer({ name });
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

export async function getNotes() {
  await devDelay();
  return noteSeeds.map((note) => ({ ...note }));
}

export async function getProjectReview(stageId: string) {
  await devDelay();
  return { stageId, waiting: stageId === "stage_fs_5" };
}
