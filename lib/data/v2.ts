import "server-only";
import { BYOR_UNSUPPORTED_URL, PREMIUM_PRICE_LABEL } from "@/lib/mock/config";
import { devDelay } from "@/lib/mock/delay";
import { findSkill, leaderboardWithViewer, noteSeeds, passedMilestone } from "@/lib/mock/catalog";
import type { SessionViewer } from "@/lib/types/domain";
import type { ByorData, CreatorData, LeaderboardData, NotesData, ProjectReviewData, TranscriptData, UpgradeData } from "@/lib/types/pages";

export async function getUpgradeData(): Promise<UpgradeData> {
  await devDelay();
  return { priceLabel: PREMIUM_PRICE_LABEL, isPremium: false };
}

export async function getLeaderboardData(viewer: SessionViewer): Promise<LeaderboardData> {
  await devDelay();
  return { rows: leaderboardWithViewer(viewer), optedOut: false };
}

export async function getTranscriptData(userId: string, skillSlug: string, viewer: SessionViewer): Promise<TranscriptData | null> {
  await devDelay();
  if (userId !== viewer.id) return null;
  const skill = findSkill(skillSlug);
  if (!skill || skill.slug !== passedMilestone.skillSlug) return null;
  return {
    learnerName: viewer.name?.trim() || "You",
    skill,
    milestones: [
      {
        stageId: passedMilestone.stageId,
        title: passedMilestone.title,
        quizPassedOn: passedMilestone.quizPassedOn,
        explainBackPassedOn: passedMilestone.explainBackPassedOn,
      },
    ],
  };
}

export async function getNotesData(): Promise<NotesData> {
  await devDelay();
  return { notes: noteSeeds.map((note) => ({ ...note })) };
}

export async function getProjectReviewData(stageId: string): Promise<ProjectReviewData | null> {
  await devDelay();
  if (stageId !== "stage_fs_2" && stageId !== "stage_art_1") return null;
  return {
    stageTitle: stageId === "stage_fs_2" ? "Hooks & State" : "Value & Form",
    skillName: stageId === "stage_fs_2" ? "Full-Stack Web Development" : "Art & Painting",
    waitingForPeer: true,
  };
}

export async function getCreatorData(): Promise<CreatorData> {
  await devDelay();
  return { status: "not_applied" };
}

export async function getByorData(): Promise<ByorData> {
  await devDelay();
  return { unsupportedUrl: BYOR_UNSUPPORTED_URL };
}
