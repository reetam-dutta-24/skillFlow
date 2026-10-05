import "server-only";
import { auth } from "@/lib/auth";
import { loadCatalog } from "@/lib/data/catalog";
import { loadProgressStats } from "@/lib/progress/stats";
import type { MasteryPointView, SkillView, WeakTopicView } from "@/lib/types/domain";

export type ProgressPayload = {
  currentStreak: number;
  longestStreak: number;
  skillsInProgress: number;
  milestonesPassedThisWeek: number;
  explainBacksPassed: number;
  skills: { skill: SkillView; points: MasteryPointView[] }[];
  weakTopics: (WeakTopicView & { href: string })[];
};

export async function getProgress(): Promise<ProgressPayload> {
  const session = await auth();
  const userId = session?.user?.id;
  const catalog = await loadCatalog();
  const stats = userId ? await loadProgressStats(userId, catalog) : null;
  const skills = catalog
    .filter((entry) => entry.skill.followed)
    .map((entry) => ({ skill: entry.skill, points: stats?.pointsBySkillId.get(entry.skill.id) ?? [] }));

  return {
    currentStreak: stats?.currentStreak ?? 0,
    longestStreak: stats?.longestStreak ?? 0,
    skillsInProgress: skills.length,
    milestonesPassedThisWeek: stats?.milestonesPassedThisWeek ?? 0,
    explainBacksPassed: stats?.explainBacksPassed ?? 0,
    skills,
    weakTopics: stats?.weakTopics ?? [],
  };
}
