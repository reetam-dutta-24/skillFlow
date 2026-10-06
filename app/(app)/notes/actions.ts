"use server";

import { auth } from "@/lib/auth";
import { EXPLAIN_REVIEW_FAILURE_TEXT } from "@/lib/mock/config";
import { explainModelConfig, judgePractice } from "@/lib/explain/judge";
import { listLearnerNotes, savePracticeNote } from "@/lib/explain/notes";
import { assemblePracticeSource, planPracticeUrls, textWithoutUrls } from "@/lib/explain/page-text";
import { loadPracticePages } from "@/lib/explain/page-source";
import { touchLearnerProgress } from "@/lib/progress/stats";
import { summarizeStageNotes } from "@/lib/explain/summarize";
import { prisma } from "@/lib/prisma";

export async function summarizeStage(stageId: string): Promise<
  { ok: true; summary: string } | { ok: false; error: "empty" | "unavailable" | "unconnected" }
> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !stageId) return { ok: false, error: "unavailable" };
  if (!explainModelConfig()) return { ok: false, error: "unconnected" };

  const notes = (await listLearnerNotes(userId)).filter((note) => note.stageId === stageId);
  if (notes.length === 0) return { ok: false, error: "empty" };
  const summary = await summarizeStageNotes({ stageTitle: notes[0].stageTitle, notes });
  if (!summary) return { ok: false, error: "unavailable" };
  return { ok: true, summary };
}

export async function reviewPractice(input: {
  skillId: string;
  concept: string;
  pageUrl: string;
  source: string;
  answer: string;
}): Promise<
  | { ok: true; understood: boolean; review: string; noted: boolean }
  | { ok: false; error: "empty" | "unavailable" | "unconnected" | "unreadable" | "blocked" }
> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "unavailable" };
  if (!explainModelConfig()) return { ok: false, error: "unconnected" };

  const concept = input.concept.trim().slice(0, 200);
  const answer = input.answer.trim().slice(0, 8000);
  const brought = [input.pageUrl, input.source].map((part) => part.trim()).filter(Boolean).join("\n\n").slice(0, 14_000);
  const plan = planPracticeUrls(brought);
  if (plan.blocked) return { ok: false, error: "blocked" };
  const loaded = plan.pages.length ? await loadPracticePages(plan.pages) : { texts: [], blocked: false, missed: false };
  if (loaded.blocked) return { ok: false, error: "blocked" };
  const source = assemblePracticeSource(loaded.texts, textWithoutUrls(brought));
  if (concept.length < 3 || !answer || !source) {
    return { ok: false, error: plan.pages.length ? "unreadable" : "empty" };
  }
  const failure = EXPLAIN_REVIEW_FAILURE_TEXT.toLowerCase();
  if (answer.toLowerCase() === failure || source.toLowerCase() === failure) return { ok: false, error: "unavailable" };

  const skill = await prisma.skill.findFirst({
    where: { id: input.skillId, status: "AVAILABLE", stages: { some: {} } },
    select: { id: true, name: true },
  });
  if (!skill) return { ok: false, error: "unavailable" };

  const review = await judgePractice({ skillName: skill.name, concept, source, answer });
  if (!review) return { ok: false, error: "unavailable" };
  if (!review.understood) return { ok: true, understood: false, review: review.review, noted: false };

  const noted = await savePracticeNote({
    userId,
    skillId: skill.id,
    concept,
    explanation: answer,
    review: review.review,
  });
  if (noted) {
    try {
      await touchLearnerProgress(userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "progress update failed";
      console.error("learner progress update failed", message.slice(0, 180));
    }
  }
  return { ok: true, understood: true, review: review.review, noted };
}
