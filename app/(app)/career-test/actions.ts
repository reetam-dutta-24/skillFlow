"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { CAREER_TEST_VERSION } from "@/lib/career/meta";
import { writeReport } from "@/lib/career/report";
import { cleanAnswers, progress, scoreAnswers } from "@/lib/career/score";
import { FREE_PATH_SLUGS } from "@/lib/niches/tiers";
import { prisma } from "@/lib/prisma";

const SIGN_IN = "Sign in again to keep your answers.";

/** Merges one page of answers into the saved set. Personal data: nothing shared is cached or expired here. */
export async function saveCareerAnswers(input: { ipip?: Record<string, number>; onet?: Record<string, number> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: SIGN_IN };
  const row = await prisma.careerAssessment.findUnique({ where: { userId }, select: { answers: true, completedAt: true } });
  if (row?.completedAt) return { ok: false as const, error: "This test is finished. Retake it from the report to answer again." };
  const current = cleanAnswers(row?.answers);
  const merged = cleanAnswers({ ipip: { ...current.ipip, ...input.ipip }, onet: { ...current.onet, ...input.onet } });
  await prisma.careerAssessment.upsert({
    where: { userId },
    create: { userId, answers: merged, version: CAREER_TEST_VERSION },
    update: { answers: merged },
  });
  return { ok: true as const, progress: progress(merged) };
}

/** Scores a complete test, writes the report, and stores both. */
export async function finishCareerTest() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: SIGN_IN };
  const row = await prisma.careerAssessment.findUnique({ where: { userId }, select: { answers: true, completedAt: true } });
  if (!row) return { ok: false as const, error: "Start the test first." };
  if (row.completedAt) return { ok: true as const };
  const answers = cleanAnswers(row.answers);
  if (!progress(answers).complete) return { ok: false as const, error: "Answer every question before seeing the report." };

  const scores = scoreAnswers(answers);
  const [skills, profile] = await Promise.all([
    prisma.skill.findMany({
      where: { slug: { in: [...FREE_PATH_SLUGS] }, status: "AVAILABLE" },
      select: { slug: true, name: true, stages: { orderBy: { order: "asc" }, take: 3, select: { title: true } } },
    }),
    prisma.learnerProfile.findUnique({ where: { userId }, select: { stage: true, goals: true, experience: true, weeklyHours: true } }),
  ]);
  const bySlug = new Map(skills.map((skill) => [skill.slug, skill]));
  const top = scores.matches
    .filter((match) => bySlug.has(match.slug))
    .slice(0, 5)
    .map((match) => {
      const skill = bySlug.get(match.slug)!;
      return { slug: skill.slug, name: skill.name, stages: skill.stages.map((stage) => stage.title) };
    });
  const report = await writeReport(scores, top, profile ?? {});

  await prisma.careerAssessment.update({
    where: { userId },
    data: { scores, report, completedAt: new Date(), version: CAREER_TEST_VERSION },
  });
  revalidatePath("/dashboard");
  return { ok: true as const };
}

/** Removes the answers and the report. Used by both Retake and Delete my results. */
export async function deleteCareerTest() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: SIGN_IN };
  await prisma.careerAssessment.deleteMany({ where: { userId } });
  revalidatePath("/dashboard");
  revalidatePath("/career-test");
  return { ok: true as const };
}
