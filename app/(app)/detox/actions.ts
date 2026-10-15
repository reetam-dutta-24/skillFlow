"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { loadDetoxInput, loadDetoxState } from "@/lib/data/detox";
import { writeDetoxGuidance } from "@/lib/detox/guidance";
import { DETOX_VERSION, isScreenBand, type DetoxAnswers } from "@/lib/detox/questions";
import { guidanceRoute, rulesGuidance } from "@/lib/detox/rules-guidance";
import {
  answerProgress,
  baselineScore,
  cleanAnswers,
  currentScore,
  isDistress,
  sectionScores,
  weekStartOf,
  weeklyBreakdown,
} from "@/lib/detox/score";
import { findDueRecall } from "@/lib/explain/recall-store";
import { explainModelConfig } from "@/lib/explain/judge";
import { openStageIdeas } from "@/lib/explain/review";
import { aiAllowed } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

/**
 * Dopamine Detox writes. Every action checks the session first and touches only the signed-in learner's rows.
 * Detox data is personal: nothing shared is cached, so nothing shared is expired.
 */

const SIGN_IN = "Sign in again to keep your answers.";

function refresh() {
  revalidatePath("/detox");
  revalidatePath("/dashboard");
}

/** Merges answers into the saved set. Called after each question, so leaving loses at most one answer. */
export async function saveDetoxAnswers(input: DetoxAnswers) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: SIGN_IN };
  const row = await prisma.detoxAssessment.findUnique({ where: { userId }, select: { answers: true, completedAt: true } });
  if (row?.completedAt) return { ok: false as const, error: "This check is finished. Retake it from the Detox page to answer again." };
  const merged = cleanAnswers({ ...cleanAnswers(row?.answers), ...cleanAnswers(input) });
  await prisma.detoxAssessment.upsert({
    where: { userId },
    create: { userId, answers: merged, version: DETOX_VERSION },
    update: { answers: merged },
  });
  return { ok: true as const, progress: answerProgress(merged) };
}

/** The guidance for these answers: support (no model), the model's words, or the rules. */
async function guidanceFor(userId: string, answers: DetoxAnswers, baseline: number, score: number, week: ReturnType<typeof weeklyBreakdown>["counts"] | null) {
  const distress = isDistress(answers);
  const route = guidanceRoute({ distress, hasModel: Boolean(explainModelConfig()), allowed: distress ? false : await aiAllowed(userId) });
  if (route === "support") return null;
  const input = { answers, baseline, score, sections: sectionScores(answers), week };
  return route === "model" ? writeDetoxGuidance(input) : rulesGuidance(input);
}

/** Works out the baseline in code, writes the guidance, and stores both. */
export async function finishDetoxCheck() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: SIGN_IN };
  const row = await prisma.detoxAssessment.findUnique({ where: { userId }, select: { answers: true, completedAt: true } });
  if (!row) return { ok: false as const, error: "Start the check first." };
  if (row.completedAt) return { ok: true as const };
  const answers = cleanAnswers(row.answers);
  if (!answerProgress(answers).complete) return { ok: false as const, error: "Answer every question before seeing your score." };
  const baseline = baselineScore(answers);
  const guidance = await guidanceFor(userId, answers, baseline, baseline, null);
  await prisma.detoxAssessment.update({
    where: { userId },
    data: {
      answers,
      baselineScore: baseline,
      version: DETOX_VERSION,
      completedAt: new Date(),
      guidance: guidance ?? undefined,
      guidanceAt: guidance ? new Date() : null,
    },
  });
  refresh();
  return { ok: true as const };
}

/** The one-minute weekly check-in. One row per UTC week; saving again this week replaces it. */
export async function saveDetoxCheckIn(input: { screenBand: string; focus: number }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: SIGN_IN };
  if (!isScreenBand(input.screenBand)) return { ok: false as const, error: "Choose your screen time this week." };
  const focus = Math.round(Number(input.focus));
  if (!Number.isInteger(focus) || focus < 1 || focus > 5) return { ok: false as const, error: "Choose your focus from 1 to 5." };
  const state = await loadDetoxState(userId);
  if (state.status !== "complete") return { ok: false as const, error: "Take the self-check first." };

  const now = new Date();
  const weekStart = weekStartOf(now);
  await prisma.detoxCheckIn.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    create: { userId, weekStart, screenTimeBand: input.screenBand, focusRating: focus },
    update: { screenTimeBand: input.screenBand, focusRating: focus },
  });
  // A check-in is a good moment for fresh next steps.
  const detox = await loadDetoxInput(userId, state.baseline, state.completedAt, state.answers);
  const guidance = await guidanceFor(userId, state.answers, state.baseline, currentScore(detox, now), weeklyBreakdown(detox, now).counts);
  if (guidance) await prisma.detoxAssessment.update({ where: { userId }, data: { guidance, guidanceAt: now } });
  refresh();
  return { ok: true as const };
}

const MAX_SESSION_MS = 4 * 60 * 60 * 1000;

/**
 * Saves a finished focus session. The browser counts the minutes; the server only accepts what fits the clock:
 * never more than the plan, never more than the time since it started.
 */
export async function saveFocusSession(input: { startedAt: number; plannedMinutes: number; focusedMinutes: number }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: "Sign in again to save this session." };
  const planned = input.plannedMinutes === 50 ? 50 : 25;
  const now = Date.now();
  const started = Number(input.startedAt);
  if (!Number.isFinite(started) || started > now || now - started > MAX_SESSION_MS) {
    return { ok: false as const, error: "This session is too old to save." };
  }
  const elapsed = Math.floor((now - started) / 60000);
  const focused = Math.max(0, Math.min(Math.floor(Number(input.focusedMinutes) || 0), planned, elapsed + 1));
  if (focused < 1) return { ok: true as const, saved: false, minutes: 0 };
  await prisma.focusSession.create({
    data: { userId, startedAt: new Date(started), endedAt: new Date(now), plannedMinutes: planned, focusedMinutes: focused },
  });
  refresh();
  return { ok: true as const, saved: true, minutes: focused };
}

export type SwapTarget =
  | { kind: "recall"; noteId: string; concept: string; stageTitle: string; skillName: string }
  | { kind: "idea"; stageId: string; concept: string; stageTitle: string; skillName: string };

/**
 * "Swap a scroll": one due recall card, or one idea from the current stage that is not explained yet. The answer goes
 * through the existing recall and explain-back actions, with their AI limits.
 */
export async function startSwap(): Promise<{ ok: true; target: SwapTarget | null } | { ok: false; error: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Sign in again to start." };
  const due = await findDueRecall(userId);
  if (due) return { ok: true, target: { kind: "recall", ...due } };

  const data = await getDashboardData();
  for (const row of data.followed) {
    const open = row.lane.find((item) => item.status === "current" || item.status === "ready");
    if (!open) continue;
    const ideas = await openStageIdeas(open.id, userId);
    if (!ideas?.concepts.length) continue;
    const explained = await prisma.learnerNote.findMany({ where: { userId, stageId: ideas.stageId }, select: { concept: true } });
    const done = new Set(explained.map((note) => note.concept));
    const concept = ideas.concepts.find((item) => !done.has(item));
    if (concept) return { ok: true, target: { kind: "idea", stageId: ideas.stageId, concept, stageTitle: ideas.title, skillName: row.skill.name } };
  }
  return { ok: true, target: null };
}

/** Retake and Delete my results: the answers, the score, check-ins, and focus sessions all go. */
export async function deleteDetox() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, error: SIGN_IN };
  await prisma.$transaction([
    prisma.detoxAssessment.deleteMany({ where: { userId } }),
    prisma.detoxCheckIn.deleteMany({ where: { userId } }),
    prisma.focusSession.deleteMany({ where: { userId } }),
  ]);
  refresh();
  return { ok: true as const };
}
