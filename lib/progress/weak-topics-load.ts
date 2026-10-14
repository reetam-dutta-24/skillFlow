import "server-only";
import { prisma } from "@/lib/prisma";
import { ideaKey, rankWeakTopics, type WeakMiss, type WeakRecall, type WeakStage, type WeakTopic } from "@/lib/progress/weak-topics";

function recallQuality(value: string): WeakRecall["quality"] {
  return value === "strong" || value === "partial" ? value : "weak";
}

/**
 * This learner's weak topics, from what the explain-back model wrote back: ideas it did not accept, and recall
 * answers it rated weak or partial. Personal, so it is read on the request and never cached.
 */
export async function loadWeakTopics(userId: string, limit = 6): Promise<WeakTopic[]> {
  const [attempts, notes, completions, recalls] = await Promise.all([
    prisma.explainBackAttempt.findMany({
      where: { userId, verdict: "NEEDS_IMPROVEMENT" },
      orderBy: { createdAt: "desc" },
      take: 400,
      select: {
        initialExplanation: true,
        followUpQuestion: true,
        feedback: true,
        createdAt: true,
        prompt: { select: { stageId: true } },
      },
    }),
    prisma.learnerNote.findMany({ where: { userId, kind: "stage" }, select: { stageId: true, concept: true } }),
    prisma.stageCompletion.findMany({ where: { userId, explainBackPassed: true }, select: { stageId: true } }),
    prisma.recallCheck.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 400,
      select: { quality: true, review: true, createdAt: true, note: { select: { stageId: true, concept: true } } },
    }),
  ]);

  const misses: WeakMiss[] = attempts.map((row) => {
    // The step wizard saves a missed idea as "<idea>\n<answer>" with the idea as followUpQuestion.
    // An older whole-stage attempt kept the model's follow-up question there instead, so it names no idea.
    const concept = row.followUpQuestion?.trim();
    const named = concept && row.initialExplanation.startsWith(`${concept}\n`) ? concept : null;
    return { stageId: row.prompt.stageId, concept: named, review: row.feedback, at: row.createdAt };
  });
  const recallRows: WeakRecall[] = recalls.flatMap((row) =>
    row.note.stageId
      ? [{ stageId: row.note.stageId, concept: row.note.concept, quality: recallQuality(row.quality), review: row.review, at: row.createdAt }]
      : [],
  );

  const stageIds = [...new Set([...misses.map((row) => row.stageId), ...recallRows.map((row) => row.stageId)])];
  if (stageIds.length === 0) return [];
  const stageRows = await prisma.roadmapStage.findMany({
    where: { id: { in: stageIds } },
    select: { id: true, title: true, image: true, skill: { select: { slug: true, name: true, image: true } } },
  });
  const stages = new Map<string, WeakStage>(
    stageRows.map((stage) => [
      stage.id,
      { id: stage.id, title: stage.title, image: stage.image ?? stage.skill.image, skillSlug: stage.skill.slug, skillName: stage.skill.name },
    ]),
  );

  return rankWeakTopics({
    misses,
    recalls: recallRows,
    passedIdeas: new Set(notes.flatMap((note) => (note.stageId ? [ideaKey(note.stageId, note.concept)] : []))),
    passedStages: new Set(completions.map((row) => row.stageId)),
    stages,
    limit,
  });
}
