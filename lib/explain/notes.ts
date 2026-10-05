import "server-only";
import { prisma } from "@/lib/prisma";
import type { LearnerNoteView } from "@/lib/explain/notes-view";

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
      const review = step.review.trim().slice(0, 900);
      if (!concept || !explanation || review.length < 40) continue;
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

/** Personal notes. Read on the request. Do not cache this with the catalog. */
export async function listLearnerNotes(userId: string): Promise<LearnerNoteView[]> {
  const rows = await prisma.learnerNote.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      skill: { select: { name: true } },
      stage: { select: { title: true, order: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    skillName: row.skill.name,
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
