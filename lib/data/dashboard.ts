import "server-only";
import { auth } from "@/lib/auth";
import { loadCatalog } from "@/lib/data/catalog";
import { prisma } from "@/lib/prisma";
import type { RoadmapStageView } from "@/lib/types/domain";
import type { DashboardData, LessonLaneItem, LessonLaneStatus } from "@/lib/types/pages";

function laneStatus(stage: RoadmapStageView): LessonLaneStatus {
  if (stage.status === "passed") return "done";
  if (stage.status === "in_progress") return "current";
  if (stage.status === "ready") return "ready";
  return "locked";
}

function laneFor(skillSlug: string, stages: RoadmapStageView[]): LessonLaneItem[] {
  return stages.map((stage) => {
    const status = laneStatus(stage);
    return {
      id: stage.id,
      title: stage.title,
      status,
      href: status === "locked" ? `/roadmap/${skillSlug}` : `/lesson/${stage.id}`,
      mastery: stage.masteryPercent > 0 ? stage.masteryPercent : undefined,
    };
  });
}

function weekAgo() {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return start;
}

export async function getDashboardData(): Promise<DashboardData> {
  const session = await auth();
  const userId = session?.user?.id;
  const catalog = await loadCatalog();
  const followedEntries = catalog.filter((entry) => entry.skill.followed);

  const followed = followedEntries.map((entry) => {
    const current =
      entry.stages.find((stage) => stage.status === "in_progress") ??
      entry.stages.find((stage) => stage.status !== "locked");
    return {
      skill: entry.skill,
      stagePosition:
        entry.stages.length === 0
          ? "No stages yet"
          : current
            ? `Stage ${current.order} of ${entry.stages.length}`
            : `${entry.stages.length} stages`,
      stageTitle: current?.title ?? "",
      roadmapHref: `/roadmap/${entry.skill.slug}`,
      lane: laneFor(entry.skill.slug, entry.stages),
    };
  });

  const nextStage = followedEntries
    .map((entry) => {
      const stage = entry.stages.find((item) => item.status === "in_progress");
      return stage ? { stage, skillName: entry.skill.name } : null;
    })
    .find((item) => item !== null);

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, longestStreak: true },
      })
    : null;

  const [explainBacksPassed, milestonesPassedThisWeek] = userId
    ? await Promise.all([
        prisma.explainBackAttempt.count({ where: { userId, verdict: "PASSED" } }),
        prisma.stageCompletion.count({
          where: { userId, explainBackPassed: true, completedAt: { gte: weekAgo() } },
        }),
      ])
    : [0, 0];

  return {
    currentStreak: user?.currentStreak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    skillsInProgress: followed.length,
    milestonesPassedThisWeek,
    explainBacksPassed,
    nextLesson: nextStage
      ? { title: nextStage.stage.title, skillName: nextStage.skillName, href: `/lesson/${nextStage.stage.id}` }
      : null,
    followed,
    catalog: catalog.map((entry) => entry.skill),
  };
}
