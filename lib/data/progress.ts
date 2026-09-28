import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { learnerStats, listMasteryHistory, listSkills, listWeakTopics } from "@/lib/mock/catalog";
import type { ProgressData } from "@/lib/types/pages";

export async function getProgressData(): Promise<ProgressData> {
  await devDelay();
  const history = listMasteryHistory();
  const skills = listSkills()
    .filter((skill) => skill.followed)
    .map((skill) => ({
      skill,
      points: history.find((series) => series.skillSlug === skill.slug)?.points ?? [],
    }));

  return {
    currentStreak: learnerStats.currentStreak,
    longestStreak: learnerStats.longestStreak,
    skillsInProgress: learnerStats.skillsInProgress,
    milestonesPassedThisWeek: learnerStats.milestonesPassedThisWeek,
    quizzesCompleted: learnerStats.quizzesCompleted,
    skills,
    weakTopics: listWeakTopics(),
  };
}
