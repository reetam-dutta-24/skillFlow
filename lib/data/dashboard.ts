import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { findStage, learnerStats, listSkills, listStages, nextLesson } from "@/lib/mock/catalog";
import type { DashboardData, LessonLaneItem } from "@/lib/types/pages";

function laneFor(skillId: string): LessonLaneItem[] {
  if (skillId === "skill_fs") {
    return [
      { id: "lane_fs_1", title: "React Fundamentals", status: "done", href: "/lesson/stage_fs_1" },
      { id: "lane_fs_2", title: "Hooks & State", status: "current", href: "/lesson/stage_fs_2" },
      { id: "lane_fs_quiz", title: "Hooks & State quiz", status: "quiz", href: "/quiz/stage_fs_2" },
      { id: "lane_fs_check", title: "Explain-back check", status: "locked", href: "/milestone/stage_fs_2" },
      { id: "lane_fs_3", title: "Server Actions", status: "locked", href: "/roadmap/full-stack-web-dev" },
    ];
  }
  if (skillId === "skill_art") {
    return [
      { id: "lane_art_1", title: "Value & Form", status: "current", href: "/lesson/stage_art_1" },
      { id: "lane_art_quiz", title: "Value & Form quiz", status: "quiz", href: "/quiz/stage_art_1" },
      { id: "lane_art_check", title: "Explain-back check", status: "locked", href: "/milestone/stage_art_1" },
      { id: "lane_art_2", title: "Color Theory", status: "locked", href: "/roadmap/art-painting" },
    ];
  }
  return [];
}

export async function getDashboardData(): Promise<DashboardData> {
  await devDelay();
  const skills = listSkills();
  const followed = skills.filter((skill) => skill.followed).map((skill) => {
    const stages = listStages(skill.id);
    const current = stages.find((stage) => stage.status === "in_progress") ?? stages[0];
    return {
      skill,
      stagePosition: current ? `Stage ${current.order} of ${stages.length}` : "Not started",
      stageTitle: current?.title ?? "Not started",
      roadmapHref: `/roadmap/${skill.slug}`,
      lane: laneFor(skill.id),
    };
  });

  return {
    currentStreak: learnerStats.currentStreak,
    longestStreak: learnerStats.longestStreak,
    skillsInProgress: learnerStats.skillsInProgress,
    milestonesPassedThisWeek: learnerStats.milestonesPassedThisWeek,
    quizzesCompleted: learnerStats.quizzesCompleted,
    nextLesson: findStage(nextLesson.stageId)
      ? {
          title: nextLesson.stageTitle,
          skillName: nextLesson.skillName,
          href: `/lesson/${nextLesson.stageId}`,
        }
      : null,
    followed,
    catalog: skills,
  };
}
