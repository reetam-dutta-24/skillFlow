import "server-only";
import { loadActivity, type Activity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";

export type ProfilePath = {
  slug: string;
  name: string;
  image: string;
  passed: number;
  total: number;
  mastery: number;
  complete: boolean;
};

export type ProfileOverview = {
  id: string;
  name: string;
  image: string | null;
  headline: string | null;
  memberSince: string;
  isAdmin: boolean;
  /** Activity counts and learning totals are shown: always to the owner, to others only when allowed. */
  showActivity: boolean;
  activityPublic: boolean;
  paths: ProfilePath[];
  stagesPassed: number;
  certificates: number;
  currentStreak: number;
  longestStreak: number;
  activity: Activity | null;
};

/**
 * The profile header, learning totals, and activity for one learner. Personal (follows, progress, the owner check),
 * so it is read on the request. Path names are public; progress and activity follow `showActivity`.
 */
export async function loadProfileOverview(userId: string, viewerId: string): Promise<ProfileOverview | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
      currentStreak: true,
      longestStreak: true,
      learnerProfile: { select: { headline: true, showActivity: true } },
      skillProgress: {
        select: {
          skill: { select: { id: true, slug: true, name: true, image: true, order: true, _count: { select: { stages: true } } } },
        },
      },
    },
  });
  if (!user) return null;

  const mine = userId === viewerId;
  const activityPublic = user.learnerProfile?.showActivity ?? true;
  const showActivity = mine || activityPublic;

  const skills = user.skillProgress.map((row) => row.skill).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const passedRows = showActivity
    ? await prisma.stageCompletion.groupBy({
        by: ["stageId"],
        where: { userId, explainBackPassed: true, stage: { skillId: { in: skills.map((skill) => skill.id) } } },
      })
    : [];
  const stageSkill = passedRows.length
    ? await prisma.roadmapStage.findMany({ where: { id: { in: passedRows.map((row) => row.stageId) } }, select: { skillId: true } })
    : [];
  const passedBySkill = new Map<string, number>();
  for (const stage of stageSkill) passedBySkill.set(stage.skillId, (passedBySkill.get(stage.skillId) ?? 0) + 1);

  const paths: ProfilePath[] = skills.map((skill) => {
    const total = skill._count.stages;
    const passed = passedBySkill.get(skill.id) ?? 0;
    return {
      slug: skill.slug,
      name: skill.name,
      image: skill.image,
      passed,
      total,
      mastery: total ? Math.round((passed / total) * 100) : 0,
      complete: total > 0 && passed === total,
    };
  });

  return {
    id: user.id,
    name: user.name?.trim() || "Learner",
    image: user.image,
    headline: user.learnerProfile?.headline ?? null,
    memberSince: user.createdAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    isAdmin: user.role === "ADMIN",
    showActivity,
    activityPublic,
    paths,
    stagesPassed: paths.reduce((sum, path) => sum + path.passed, 0),
    certificates: paths.filter((path) => path.complete).length,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    activity: showActivity ? await loadActivity(userId) : null,
  };
}
