import "server-only";
import { auth } from "@/lib/auth";
import { loadCatalog } from "@/lib/data/catalog";
import { loadProgressStats } from "@/lib/progress/stats";
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

  const stats = userId ? await loadProgressStats(userId, catalog) : null;

  return {
    currentStreak: stats?.currentStreak ?? 0,
    longestStreak: stats?.longestStreak ?? 0,
    skillsInProgress: followed.length,
    milestonesPassedThisWeek: stats?.milestonesPassedThisWeek ?? 0,
    explainBacksPassed: stats?.explainBacksPassed ?? 0,
    nextLesson: nextStage
      ? { title: nextStage.stage.title, skillName: nextStage.skillName, href: `/lesson/${nextStage.stage.id}` }
      : null,
    followed,
    catalog: catalog.map((entry) => entry.skill),
  };
}
