import "server-only";
import { auth } from "@/lib/auth";
import { loadCatalog } from "@/lib/data/catalog";
import { prisma } from "@/lib/prisma";
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

function weekAgo() {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return start;
}

export async function getProgress(): Promise<ProgressPayload> {
  const session = await auth();
  const userId = session?.user?.id;
  const catalog = await loadCatalog();
  const skills = catalog
    .filter((entry) => entry.skill.followed)
    .map((entry) => ({ skill: entry.skill, points: [] }));

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, longestStreak: true },
      })
    : null;

  const [quizzesCompleted, milestonesPassedThisWeek] = userId
    ? await Promise.all([
        prisma.quizAttempt.count({ where: { userId, passed: true } }),
        prisma.stageCompletion.count({
          where: { userId, explainBackPassed: true, completedAt: { gte: weekAgo() } },
        }),
      ])
    : [0, 0];

  return {
    currentStreak: user?.currentStreak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    skillsInProgress: skills.length,
    milestonesPassedThisWeek,
    quizzesCompleted,
    skills,
    weakTopics: [],
  };
}
