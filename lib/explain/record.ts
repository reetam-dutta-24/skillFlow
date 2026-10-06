import "server-only";
import { prisma } from "@/lib/prisma";
import { openStageLimit } from "@/lib/progress/formula";
import { touchLearnerProgress } from "@/lib/progress/stats";

export async function recordExplainBack(input: {
  userId: string;
  stageId: string;
  skillId: string;
  stageOrder: number;
  stageCount: number;
  promptId: string;
  answer: string;
  followUpQuestion: string | null;
  followUpAnswer: string | null;
  verdict: "PASSED" | "NEEDS_IMPROVEMENT";
  feedback: string;
}) {
  const limit = openStageLimit(input.stageCount);
  await prisma.$transaction(async (tx) => {
    await tx.explainBackAttempt.create({
      data: {
        userId: input.userId,
        promptId: input.promptId,
        initialExplanation: input.answer,
        inputMethod: "text",
        followUpQuestion: input.followUpQuestion,
        followUpResponse: input.followUpAnswer,
        verdict: input.verdict,
        feedback: input.feedback,
      },
    });
    if (input.verdict !== "PASSED") return;

    await tx.stageCompletion.upsert({
      where: { userId_stageId: { userId: input.userId, stageId: input.stageId } },
      create: {
        userId: input.userId,
        stageId: input.stageId,
        explainBackPassed: true,
        completedAt: new Date(),
      },
      update: { explainBackPassed: true, completedAt: new Date() },
    });

    const progress = await tx.userSkillProgress.findUnique({
      where: { userId_skillId: { userId: input.userId, skillId: input.skillId } },
      select: { currentStageOrder: true },
    });
    if (!progress || progress.currentStageOrder !== input.stageOrder) return;
    const nextOrder = input.stageOrder + 1;
    if (nextOrder > limit) return;
    const next = await tx.roadmapStage.findFirst({
      where: { skillId: input.skillId, order: nextOrder, monetized: false },
      select: { id: true },
    });
    if (!next) return;
    await tx.userSkillProgress.update({
      where: { userId_skillId: { userId: input.userId, skillId: input.skillId } },
      data: { currentStageOrder: nextOrder },
    });
  });
  try {
    await touchLearnerProgress(input.userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "progress update failed";
    console.error("learner progress update failed", message.slice(0, 180));
  }
}
