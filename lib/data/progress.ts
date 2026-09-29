import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { learnerStats, listMasteryHistory, listSkills, listWeakTopics } from "@/lib/mock/catalog";
import type { MasteryPointView, SkillView, WeakTopicView } from "@/lib/types/domain";

export type ProgressPayload = {
  currentStreak: number;
  longestStreak: number;
  skillsInProgress: number;
  milestonesPassedThisWeek: number;
  quizzesCompleted: number;
  skills: { skill: SkillView; points: MasteryPointView[] }[];
  weakTopics: (WeakTopicView & { href: string })[];
};

export async function getProgress(): Promise<ProgressPayload> {
  await devDelay();
  const history = listMasteryHistory();
  const skills = listSkills()
    .filter((skill) => skill.followed)
    .map((skill) => ({
      skill,
      points: history.find((row) => row.skillSlug === skill.slug)?.points ?? [],
    }));
  return {
    currentStreak: learnerStats.currentStreak,
    longestStreak: learnerStats.longestStreak,
    skillsInProgress: learnerStats.skillsInProgress,
    milestonesPassedThisWeek: learnerStats.milestonesPassedThisWeek,
    quizzesCompleted: learnerStats.quizzesCompleted,
    skills,
    weakTopics: listWeakTopics().map((topic) => ({ ...topic, href: `/lesson/${topic.stageId}` })),
  };
}
