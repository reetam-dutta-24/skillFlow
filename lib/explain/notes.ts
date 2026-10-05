import "server-only";
import { prisma } from "@/lib/prisma";
import { notesFromPassedAttempt, type LearnerNoteView } from "@/lib/explain/notes-view";

const LABEL = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export async function saveLearnerNotes(input: {
  userId: string;
  skillId: string;
  stageId: string;
  steps: { concept: string; explanation: string; review: string; position: number }[];
}): Promise<boolean> {
  try {
    for (const step of input.steps) {
      const concept = step.concept.trim().slice(0, 500);
      const explanation = step.explanation.trim().slice(0, 8000);
      const review = step.review.trim().slice(0, 4000);
      if (!concept || !explanation || review.length < 20) continue;
      await prisma.learnerNote.upsert({
        where: { userId_stageId_concept: { userId: input.userId, stageId: input.stageId, concept } },
        create: {
          userId: input.userId,
          skillId: input.skillId,
          stageId: input.stageId,
          concept,
          explanation,
          review,
          position: step.position,
        },
        update: { explanation, review, position: step.position, skillId: input.skillId },
      });
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "save failed";
    console.error("learner note save failed", message.slice(0, 180));
    return false;
  }
}

/** A pass recorded before notes existed still becomes a note the next time Notes is opened. */
async function ensurePassedNotes(userId: string) {
  const [attempts, existing] = await Promise.all([
    prisma.explainBackAttempt.findMany({
      where: { userId, verdict: "PASSED" },
      orderBy: { createdAt: "desc" },
      include: { prompt: { select: { stage: { select: { id: true, title: true, skillId: true } } } } },
    }),
    prisma.learnerNote.findMany({ where: { userId }, select: { stageId: true } }),
  ]);
  const have = new Set(existing.map((row) => row.stageId));
  const seen = new Set<string>();
  for (const attempt of attempts) {
    const stage = attempt.prompt.stage;
    if (have.has(stage.id) || seen.has(stage.id)) continue;
    seen.add(stage.id);
    const steps = notesFromPassedAttempt({
      stageTitle: stage.title,
      explanation: attempt.initialExplanation,
      feedback: attempt.feedback,
    });
    if (steps.length === 0) continue;
    await saveLearnerNotes({ userId, skillId: stage.skillId, stageId: stage.id, steps });
  }
}

/** Personal notes. Read on the request. Do not cache this with the catalog. */
export async function listLearnerNotes(userId: string): Promise<LearnerNoteView[]> {
  await ensurePassedNotes(userId);
  const rows = await prisma.learnerNote.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      skill: { select: { name: true, order: true } },
      stage: { select: { title: true, order: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    skillName: row.skill.name,
    skillOrder: row.skill.order,
    stageId: row.stageId,
    stageTitle: row.stage.title,
    stageOrder: row.stage.order,
    concept: row.concept,
    explanation: row.explanation,
    review: row.review,
    position: row.position,
    updatedAt: row.updatedAt.toISOString(),
    updatedLabel: LABEL.format(row.updatedAt),
  }));
}
