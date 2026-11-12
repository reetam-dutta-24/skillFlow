import { auth } from "@/lib/auth";
import { ModelUnavailableError, notSureReply, numberSources, streamAnswer } from "@/lib/assistant/answer";
import { verifyCitations } from "@/lib/assistant/citations";
import { explainBackGuard, learnerIntent, type GuardDecision } from "@/lib/assistant/intent";
import { loadGuardStages, loadLearnerBasics, loadLearnerContext, type LearnerContext } from "@/lib/assistant/learner-context";
import {
  ERROR_COPY,
  assistantRequestSchema,
  trimHistory,
  type AssistantErrorCode,
  type AssistantEvent,
  type AssistantSource,
} from "@/lib/assistant/protocol";
import { retrieve } from "@/lib/assistant/retrieval";
import { userHasPremium } from "@/lib/billing/access";
import { aiAllowed } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

/**
 * The LearnProof Assistant. Signed-in learners only; every question counts against aiAllowed(). Retrieval has five
 * seconds, generation the explain-back model's 50, and a client disconnect aborts both. The reply is newline-delimited
 * JSON (lib/assistant/protocol.ts). Nothing the learner types is stored: chats live in the browser tab only, and the
 * usage counter below records a count per day, never the message.
 */

const RETRIEVAL_BUDGET_MS = 5000;
const MAX_BODY_BYTES = 64_000;
/** A short question is treated as a follow-up, so the previous question joins the search. */
const FOLLOW_UP_WORDS = 7;

function fail(code: AssistantErrorCode, status: number) {
  return Response.json({ t: "error", code, message: ERROR_COPY[code] } satisfies AssistantEvent, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

function withBudget<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("retrieval timed out")), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function countUsage() {
  const period = new Date().toISOString().slice(0, 10);
  await prisma.apiUsage
    .upsert({ where: { provider_period: { provider: "assistant", period } }, create: { provider: "assistant", period, count: 1 }, update: { count: { increment: 1 } } })
    .catch(() => undefined);
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return fail("signed-out", 401);

  // The largest valid body (a 1,000-character question and six 4,000-character turns) is well under this. Anything
  // bigger is refused before it is parsed, so a huge body cannot tie up the server.
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return fail("invalid", 413);
  const rawBody = await request.text().catch(() => "");
  if (rawBody.length > MAX_BODY_BYTES) return fail("invalid", 413);
  let body: unknown = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }
  const parsed = assistantRequestSchema.safeParse(body);
  if (!parsed.success) return fail("invalid", 400);
  if (!(await aiAllowed(userId))) return fail("rate-limit", 429);

  const { message, pathname } = parsed.data;
  const history = trimHistory(parsed.data.history);
  const premium = session.user.role === "ADMIN" || (await userHasPremium(userId));
  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort(), { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: AssistantEvent) => {
        if (!abort.signal.aborted) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        void countUsage();
        const lastUser = [...history].reverse().find((turn) => turn.role === "user")?.content ?? "";
        const followUp = lastUser && message.split(/\s+/).length <= FOLLOW_UP_WORDS;
        const searchText = followUp ? `${message}\n${lastUser.slice(0, 300)}` : message;

        const prepared = await withBudget(
          (async () => {
            const basics = await loadLearnerBasics(userId, pathname);
            const [result, learner] = await Promise.all([
              retrieve(searchText, { premium, followedSkillIds: basics.followedSkillIds, currentStageIds: basics.currentStageIds, signal: abort.signal }, message),
              learnerIntent(message) ? loadLearnerContext(userId, basics) : Promise.resolve<LearnerContext | null>(null),
            ]);
            // Every source the model would see goes through the guard, not only the first few.
            const topStageIds = result.sources.map((row) => row.stageId);
            const guard: GuardDecision = explainBackGuard({
              question: message,
              topStageIds,
              firstKind: result.sources[0]?.kind,
              stages: await loadGuardStages(userId, topStageIds.filter((id): id is string => Boolean(id))),
            });
            return { result, learner, guard };
          })(),
          RETRIEVAL_BUDGET_MS,
        );

        const { result, learner, guard } = prepared;
        if (result.sources.length === 0 && !learner) {
          const reply = notSureReply(message);
          send({ t: "meta", mode: "not-sure" });
          send({ t: "final", mode: "not-sure", text: reply.text, sources: reply.sources });
          return;
        }

        const mode = guard.mode;
        send({ t: "meta", mode });
        const numbered = numberSources(result.sources, learner, mode);
        const raw = await streamAnswer({
          mode,
          concept: guard.mode === "hint" ? guard.concept : undefined,
          question: message,
          // History comes from the browser. In hint mode it is left out, so made-up earlier turns cannot argue the
          // model out of its rules.
          history: mode === "hint" ? [] : history,
          sources: numbered,
          signal: abort.signal,
          onDelta: (text) => send({ t: "delta", text }),
        });
        const verified = verifyCitations(raw, numbered.map((source) => ({ n: source.n, url: source.external ?? source.href, lessonUrl: source.href })));
        const cited = verified.cited.length ? numbered.filter((source) => verified.cited.includes(source.n)) : numbered;
        const sources: AssistantSource[] = cited.map((source) => ({
          n: source.n,
          kind: source.kind,
          title: source.title,
          href: source.href,
          external: source.external,
          detail: source.detail,
        }));
        send({ t: "final", mode, text: verified.text, sources });
      } catch (error) {
        if (abort.signal.aborted) return;
        const known = error instanceof ModelUnavailableError;
        if (!known) console.error("[assistant] request failed", error instanceof Error ? error.message.slice(0, 180) : "error");
        send({ t: "error", code: "unavailable", message: ERROR_COPY.unavailable });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed by a disconnect.
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "private, no-store",
      "x-accel-buffering": "no",
    },
  });
}
