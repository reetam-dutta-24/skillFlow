import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { loadCatalog } from "@/lib/data/catalog";
import { QUIZ_PASS_THRESHOLD } from "@/lib/mock/config";
import { prisma } from "@/lib/prisma";
import type { QuizOptionView, QuizQuestionView, QuizView } from "@/lib/types/domain";
import type { QuizData } from "@/lib/types/pages";

export { QUIZ_PASS_THRESHOLD };

function toOptions(value: Prisma.JsonValue): QuizOptionView[] {
  if (!Array.isArray(value)) return [];
  const options: QuizOptionView[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    if (typeof item.id !== "string" || typeof item.label !== "string") continue;
    if (!item.id || !item.label) continue;
    options.push({ id: item.id, label: item.label });
  }
  return options;
}

function toQuiz(row: {
  id: string;
  stageId: string;
  version: number;
  createdAt: Date;
  questions: {
    id: string;
    quizId: string;
    prompt: string;
    options: Prisma.JsonValue;
    correctOptionId: string;
    explanation: string;
    order: number;
  }[];
}): QuizView {
  const questions: QuizQuestionView[] = [];
  for (const question of row.questions) {
    const options = toOptions(question.options);
    if (options.length === 0) continue;
    if (!options.some((option) => option.id === question.correctOptionId)) continue;
    questions.push({
      id: question.id,
      quizId: question.quizId,
      prompt: question.prompt,
      options,
      correctOptionId: question.correctOptionId,
      explanation: question.explanation,
      order: question.order,
      sourceTitle: "",
    });
  }
  return {
    id: row.id,
    stageId: row.stageId,
    version: row.version,
    questions,
    createdAt: row.createdAt.toISOString(),
  };
}

export const getQuiz = cache(async (stageId: string): Promise<QuizData | null> => {
  const catalog = await loadCatalog();
  const entry = catalog.find((item) => item.stages.some((stage) => stage.id === stageId));
  const stage = entry?.stages.find((item) => item.id === stageId);
  if (!entry || !stage) return null;

  if (stage.status === "locked") {
    return {
      kind: "locked",
      skillSlug: entry.skill.slug,
      skillName: entry.skill.name,
      stageTitle: stage.title,
      previousStageTitle: stage.previousStageTitle,
    };
  }

  const row = await prisma.quiz.findUnique({
    where: { stageId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  const quiz = row ? toQuiz(row) : null;
  if (!quiz || quiz.questions.length === 0) {
    return {
      kind: "empty",
      skillSlug: entry.skill.slug,
      skillName: entry.skill.name,
      stageTitle: stage.title,
    };
  }

  return { kind: "ready", skill: entry.skill, stage, quiz };
});
