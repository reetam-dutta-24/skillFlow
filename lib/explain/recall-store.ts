import "server-only";
import { prisma } from "@/lib/prisma";
import { explainModelConfig } from "@/lib/explain/judge";
import { recallDue, retentionFactor } from "@/lib/explain/recall";

export type DueRecall = {
  noteId: string;
  concept: string;
  stageTitle: string;
  skillName: string;
};

/** The oldest passed stage idea that is ready to be explained again. One at a time. */
export async function findDueRecall(userId: string, now = new Date()): Promise<DueRecall | null> {
  if (!explainModelConfig()) return null;
  const notes = await prisma.learnerNote.findMany({
    where: { userId, kind: "stage", stageId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      concept: true,
      createdAt: true,
      skill: { select: { name: true } },
      stage: { select: { title: true } },
      recallChecks: { orderBy: { createdAt: "asc" }, select: { createdAt: true } },
    },
  });
  const due = notes.find((note) =>
    note.stage &&
    recallDue({
      passedAt: note.createdAt,
      answeredAt: note.recallChecks.map((check) => check.createdAt),
      now,
    }),
  );
  if (!due?.stage) return null;
  return { noteId: due.id, concept: due.concept, stageTitle: due.stage.title, skillName: due.skill.name };
}

export async function retentionFor(userId: string): Promise<number | null> {
  const rows = await prisma.recallCheck.findMany({ where: { userId }, select: { score: true } });
  return retentionFactor(rows.map((row) => row.score));
}
