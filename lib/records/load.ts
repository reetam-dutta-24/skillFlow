import "server-only";
import { pathIsComplete, recordDate } from "@/lib/records/format";
import { prisma } from "@/lib/prisma";

export type StageRecord = {
  order: number;
  title: string;
  passed: boolean;
  when: string;
};

export type PathRecord = {
  userId: string;
  learnerName: string;
  skillName: string;
  skillSlug: string;
  stages: StageRecord[];
  passedCount: number;
  stageCount: number;
  complete: boolean;
  issuedOn: string | null;
};

export type FollowedRecord = {
  slug: string;
  name: string;
  passed: number;
  total: number;
  complete: boolean;
};

async function resolveUser(userId: string, sessionUserId?: string) {
  const id = userId === "me" ? sessionUserId : userId;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id }, select: { id: true, name: true } });
}

/** Passed stages for one learner and one path. Personal data, read on the request. */
export async function loadPathRecord(userId: string, skillSlug: string, sessionUserId?: string): Promise<PathRecord | null> {
  const user = await resolveUser(userId, sessionUserId);
  if (!user) return null;
  const skill = await prisma.skill.findUnique({
    where: { slug: skillSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      stages: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true } },
    },
  });
  if (!skill || skill.stages.length === 0) return null;

  const completions = await prisma.stageCompletion.findMany({
    where: { userId: user.id, explainBackPassed: true, stageId: { in: skill.stages.map((stage) => stage.id) } },
    select: { stageId: true, completedAt: true },
  });
  const whenByStage = new Map(completions.map((row) => [row.stageId, row.completedAt]));
  const stages = skill.stages.map((stage) => {
    const passed = whenByStage.has(stage.id);
    return {
      order: stage.order,
      title: stage.title,
      passed,
      when: passed ? recordDate(whenByStage.get(stage.id) ?? null) : "",
    };
  });
  const dates = completions.map((row) => row.completedAt).filter((value): value is Date => value instanceof Date);
  const latest = dates.sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
  const passedCount = stages.filter((stage) => stage.passed).length;
  return {
    userId: user.id,
    learnerName: user.name?.trim() || "A SkillFlow learner",
    skillName: skill.name,
    skillSlug: skill.slug,
    stages,
    passedCount,
    stageCount: skill.stages.length,
    complete: pathIsComplete(skill.stages.length, passedCount),
    issuedOn: latest ? recordDate(latest) : null,
  };
}

/** Followed paths that already have a passed stage. Personal, read on the request. */
export async function followedRecords(userId: string): Promise<FollowedRecord[]> {
  const rows = await prisma.userSkillProgress.findMany({
    where: { userId },
    select: { skill: { select: { id: true, slug: true, name: true } } },
    orderBy: { skill: { name: "asc" } },
  });
  const skillIds = rows.map((row) => row.skill.id);
  if (skillIds.length === 0) return [];

  const stages = await prisma.roadmapStage.findMany({
    where: { skillId: { in: skillIds } },
    select: { skillId: true },
  });
  const passed = await prisma.stageCompletion.findMany({
    where: { userId, explainBackPassed: true, stage: { skillId: { in: skillIds } } },
    select: { stage: { select: { skillId: true } } },
  });
  const totals = new Map<string, number>();
  for (const stage of stages) totals.set(stage.skillId, (totals.get(stage.skillId) ?? 0) + 1);
  const passes = new Map<string, number>();
  for (const row of passed) passes.set(row.stage.skillId, (passes.get(row.stage.skillId) ?? 0) + 1);

  return rows.flatMap((row) => {
    const total = totals.get(row.skill.id) ?? 0;
    const done = passes.get(row.skill.id) ?? 0;
    if (done === 0) return [];
    return [{ slug: row.skill.slug, name: row.skill.name, passed: done, total, complete: pathIsComplete(total, done) }];
  });
}
