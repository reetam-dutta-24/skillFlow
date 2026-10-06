import "server-only";
import { prisma } from "@/lib/prisma";

export type PostQuestion = {
  id: string;
  body: string;
  answer: string | null;
  author: { id: string; name: string | null };
};

const QUESTION_MAX = 500;
const ANSWER_MAX = 1000;

export async function listPostQuestions(contributionId: string): Promise<PostQuestion[]> {
  const rows = await prisma.contributionQuestion.findMany({
    where: { contributionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      answer: true,
      createdAt: true,
      answeredAt: true,
      author: { select: { id: true, name: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    answer: row.answer,
    author: row.author,
  }));
}

/** One question from a learner who is not the post's author. A published post only. */
export async function askPostQuestion(userId: string, contributionId: string, body: string) {
  const text = body.trim().slice(0, QUESTION_MAX);
  if (!text) return { ok: false as const, error: "Write the question first." };
  const post = await prisma.communityContribution.findUnique({
    where: { id: contributionId },
    select: { status: true, authorId: true },
  });
  if (!post || post.status !== "MERGED") return { ok: false as const, error: "Ask on a published post." };
  if (post.authorId === userId) return { ok: false as const, error: "Answer the questions on your own post." };
  const existing = await prisma.contributionQuestion.findUnique({
    where: { contributionId_authorId: { contributionId, authorId: userId } },
    select: { id: true },
  });
  if (existing) return { ok: false as const, error: "You already asked about this post." };
  await prisma.contributionQuestion.create({
    data: { contributionId, authorId: userId, body: text },
  });
  return { ok: true as const };
}

/** The post's author writes the one answer. */
export async function answerPostQuestion(userId: string, questionId: string, answer: string) {
  const text = answer.trim().slice(0, ANSWER_MAX);
  if (!text) return { ok: false as const, error: "Write the answer first." };
  const question = await prisma.contributionQuestion.findUnique({
    where: { id: questionId },
    select: { answer: true, contribution: { select: { authorId: true } } },
  });
  if (!question || question.contribution.authorId !== userId) return { ok: false as const, error: "Only the author can answer." };
  if (question.answer) return { ok: false as const, error: "This question already has an answer." };
  await prisma.contributionQuestion.update({
    where: { id: questionId },
    data: { answer: text, answeredAt: new Date() },
  });
  return { ok: true as const };
}
