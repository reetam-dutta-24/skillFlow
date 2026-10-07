import "server-only";
import type { CareerReport } from "@/lib/career/report";
import { cleanAnswers, progress, type CareerAnswers, type CareerScores } from "@/lib/career/score";
import { prisma } from "@/lib/prisma";

export type CareerState =
  | { status: "none" }
  | { status: "in-progress"; answers: CareerAnswers; answered: number; total: number; firstOpenPage: number }
  | { status: "complete"; scores: CareerScores; report: CareerReport; completedAt: Date; version: string };

/** This learner's test. Personal, so it is read on the request and never cached. */
export async function loadCareerState(userId: string): Promise<CareerState> {
  const row = await prisma.careerAssessment.findUnique({
    where: { userId },
    select: { answers: true, scores: true, report: true, completedAt: true, version: true },
  });
  if (!row) return { status: "none" };
  if (row.completedAt && row.scores && row.report) {
    return {
      status: "complete",
      scores: row.scores as unknown as CareerScores,
      report: row.report as unknown as CareerReport,
      completedAt: row.completedAt,
      version: row.version,
    };
  }
  const answers = cleanAnswers(row.answers);
  const state = progress(answers);
  return { status: "in-progress", answers, answered: state.answered, total: state.total, firstOpenPage: state.firstOpenPage };
}
