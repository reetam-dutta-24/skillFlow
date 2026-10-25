import "server-only";
import type { GuardStage } from "@/lib/assistant/intent";
import { loadDetoxCard } from "@/lib/data/detox";
import { stageConcepts } from "@/lib/explain/concepts";
import { findDueRecall } from "@/lib/explain/recall-store";
import { prisma } from "@/lib/prisma";
import { loadWeakTopics } from "@/lib/progress/weak-topics-load";

/**
 * The asking learner's own data, read live on the request with existing services. Every query is filtered by this
 * learner's id; nothing here is embedded, cached, or shared, and no other learner's rows are ever read.
 */

export type FollowedPath = {
  skillId: string;
  name: string;
  slug: string;
  passed: number;
  total: number;
  /** The first stage not passed yet, which is the one that is open next. */
  next: { id: string; order: number; title: string } | null;
  hasPlan: boolean;
};

export type LearnerBasics = {
  followed: FollowedPath[];
  followedSkillIds: Set<string>;
  currentStageIds: Set<string>;
};

/** Followed paths with passed counts and the next stage. Used for retrieval boosts on every question. */
export async function loadLearnerBasics(userId: string, pathname?: string): Promise<LearnerBasics> {
  const [progress, completions, plans] = await Promise.all([
    prisma.userSkillProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        skill: {
          select: {
            id: true,
            name: true,
            slug: true,
            stages: { orderBy: { order: "asc" }, select: { id: true, order: true, title: true } },
          },
        },
      },
    }),
    prisma.stageCompletion.findMany({ where: { userId, explainBackPassed: true }, select: { stageId: true } }),
    prisma.learningPlan.findMany({ where: { userId }, select: { skillId: true } }),
  ]);
  const passed = new Set(completions.map((row) => row.stageId));
  const planned = new Set(plans.map((row) => row.skillId));
  const followed = progress.map(({ skill }) => {
    const next = skill.stages.find((stage) => !passed.has(stage.id)) ?? null;
    return {
      skillId: skill.id,
      name: skill.name,
      slug: skill.slug,
      passed: skill.stages.filter((stage) => passed.has(stage.id)).length,
      total: skill.stages.length,
      next,
      hasPlan: planned.has(skill.id),
    };
  });
  const currentStageIds = new Set(followed.flatMap((path) => (path.next ? [path.next.id] : [])));
  const onStage = pathname ? /^\/(?:lesson|milestone)\/([A-Za-z0-9_-]{8,40})/.exec(pathname)?.[1] : undefined;
  if (onStage) currentStageIds.add(onStage);
  return { followed, followedSkillIds: new Set(followed.map((path) => path.skillId)), currentStageIds };
}

export type LearnerContext = { title: string; href: string; text: string };

/** A short, factual summary of this learner's own state, for a question about themselves. */
export async function loadLearnerContext(userId: string, basics: LearnerBasics): Promise<LearnerContext> {
  const [user, weak, recall, detox, notes] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { currentStreak: true, longestStreak: true } }),
    loadWeakTopics(userId, 4).catch(() => []),
    findDueRecall(userId).catch(() => null),
    loadDetoxCard(userId).catch(() => null),
    prisma.learnerNote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { concept: true, skill: { select: { name: true } } },
    }),
  ]);

  const lines: string[] = [];
  if (basics.followed.length === 0) {
    lines.push("Followed paths: none yet. Following a path from Niches (/skills) puts it on Home.");
  } else {
    lines.push("Followed paths:");
    for (const path of basics.followed) {
      const mastery = path.total ? Math.round((path.passed / path.total) * 100) : 0;
      const next = path.next
        ? `next stage ${path.next.order}: ${path.next.title} (/lesson/${path.next.id})`
        : path.total
          ? `every stage passed; certificate ready (/progress)`
          : "no stages yet (Premium niche)";
      lines.push(`- ${path.name}: ${path.passed} of ${path.total} stages passed, mastery ${mastery}%, ${next}${path.hasPlan ? ", personal plan on" : ""}.`);
    }
  }
  if (user) lines.push(`Streak: current ${user.currentStreak} days, longest ${user.longestStreak} days.`);
  if (weak.length) {
    lines.push("Topics to strengthen:");
    for (const topic of weak) lines.push(`- ${topic.concept} (${topic.skillName}, ${topic.stageTitle}; ${topic.status === "open" ? "not passed yet" : topic.status === "recall" ? "recall was weak" : "took several tries"}).`);
  } else {
    lines.push("Topics to strengthen: none right now.");
  }
  lines.push(recall ? `Recall due now: "${recall.concept}" from ${recall.stageTitle} (${recall.skillName}).` : "Recall due now: none.");
  if (detox?.ready) {
    lines.push(`Detox Score: ${detox.ready.score} (${detox.ready.band.label}). ${detox.ready.summary}`);
  } else if (detox?.state.status === "in-progress") {
    lines.push("Detox Score: the self-check is started but not finished (/detox/check).");
  } else {
    lines.push("Detox Score: not taken yet (/detox).");
  }
  if (notes.length) lines.push(`Recent notes: ${notes.map((note) => `${note.concept} (${note.skill.name})`).join("; ")}.`);
  return { title: "Your SkillFlow data (live)", href: "/progress", text: lines.join("\n").slice(0, 3000) };
}

/** For the explain-back guard: each candidate stage's ideas and whether this learner passed it. */
export async function loadGuardStages(userId: string, stageIds: readonly string[]): Promise<Map<string, GuardStage>> {
  const ids = [...new Set(stageIds)].filter(Boolean);
  if (!ids.length) return new Map();
  const [stages, passed] = await Promise.all([
    prisma.roadmapStage.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, learningObjectives: true, explainBackPrompt: { select: { rubric: true } } },
    }),
    prisma.stageCompletion.findMany({ where: { userId, stageId: { in: ids }, explainBackPassed: true }, select: { stageId: true } }),
  ]);
  const done = new Set(passed.map((row) => row.stageId));
  return new Map(
    stages.map((stage) => [
      stage.id,
      {
        stageId: stage.id,
        title: stage.title,
        concepts: stageConcepts(stage.learningObjectives, stage.explainBackPrompt?.rubric ?? []),
        passed: done.has(stage.id),
      },
    ]),
  );
}
