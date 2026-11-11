"use server";

import { auth } from "@/lib/auth";
import { reviewMilestone } from "@/lib/data/milestone";
import { finishExplainWizard, reviewConceptStep, reviewHandsOnStep } from "@/lib/explain/review";
import type { ExplainReview } from "@/lib/types/pages";
import { aiAllowed } from "@/lib/limits";
import { cleanMethod } from "@/lib/explain/dictation";
import { cleanTrace } from "@/lib/explain/authenticity";

export async function reviewExplanation(input: {
  stageId: string;
  answer: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
}): Promise<ExplainReview> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unavailable" };
  if (!(await aiAllowed(session.user.id))) return { ok: false, error: "unavailable" };
  return reviewMilestone({ ...input, userId: session.user.id });
}

export async function reviewConcept(input: {
  stageId: string;
  concept: string;
  answer: string;
  /** How the answer was given: typed, spoken, or both. A label only; it never changes how the answer is judged. */
  method?: string;
  /** Paste and typing counts for this answer. Checked and bounded on the server; never trusted on its own. */
  trace?: unknown;
}) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "unavailable" as const };
  if (!(await aiAllowed(session.user.id))) return { ok: false as const, error: "unavailable" as const };
  return reviewConceptStep({
    stageId: String(input.stageId),
    concept: String(input.concept),
    answer: String(input.answer),
    method: cleanMethod(input.method),
    trace: cleanTrace(input.trace),
    userId: session.user.id,
  });
}

/** Review one piece of hands-on work for a stage on a practical path. Counts against the same AI limits. */
export async function submitHandsOn(input: { stageId: string; kind: string; url: string; writeUp: string; method?: string; trace?: unknown }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "unavailable" as const };
  if (!(await aiAllowed(session.user.id))) return { ok: false as const, error: "unavailable" as const };
  return reviewHandsOnStep({
    stageId: String(input.stageId),
    kind: input.kind,
    url: input.url,
    writeUp: input.writeUp,
    method: cleanMethod(input.method),
    trace: cleanTrace(input.trace),
    userId: session.user.id,
  });
}

/** Records the stage from the ideas the server already accepted. The browser sends only which stage. */
export async function completeExplainWizard(input: { stageId: string; method?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "unavailable" as const };
  return finishExplainWizard({ stageId: String(input.stageId), method: cleanMethod(input.method), userId: session.user.id });
}
