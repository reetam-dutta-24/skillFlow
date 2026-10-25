import "server-only";
import { EMBED_DIMENSIONS, l2Normalize } from "@/lib/assistant/vector";

/**
 * Text embeddings for the assistant, with fetch (no SDK), like lib/explain/judge.ts.
 *
 * Gemini's OpenAI-compatible /embeddings endpoint does not document `dimensions` or task types, so Gemini is called
 * through its native batchEmbedContents with `taskType` and `outputDimensionality: 768`. gemini-embedding-001 only
 * normalises its full 3072-dimension output, so every vector is L2-normalised here.
 *
 * ASSISTANT_EMBED_URL points at an OpenAI-compatible /embeddings endpoint instead (the end-to-end stub). It stays unset
 * in production. OPENAI_API_KEY is the paid fallback when there is no Gemini key, as for explain-back.
 */

export type EmbedTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export type Embedder = {
  /** Stored on every chunk. A query is only compared with chunks embedded by the same model. */
  model: string;
  provider: "gemini" | "openai" | "stub";
  url: string;
  key: string;
  batchSize: number;
};

const GEMINI_MODEL = "gemini-embedding-001";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export function embedderConfig(env: Record<string, string | undefined> = process.env): Embedder | null {
  if (env.ASSISTANT_EMBED_URL) {
    return { model: "stub-embed-768", provider: "stub", url: env.ASSISTANT_EMBED_URL, key: env.EXPLAIN_MODEL_KEY || "stub", batchSize: 64 };
  }
  if (env.GEMINI_API_KEY) {
    return { model: GEMINI_MODEL, provider: "gemini", url: `${GEMINI_BASE}/${GEMINI_MODEL}:batchEmbedContents`, key: env.GEMINI_API_KEY, batchSize: 50 };
  }
  if (env.OPENAI_API_KEY) {
    return { model: "text-embedding-3-small", provider: "openai", url: "https://api.openai.com/v1/embeddings", key: env.OPENAI_API_KEY, batchSize: 64 };
  }
  return null;
}

export type EmbedOptions = {
  task: EmbedTask;
  /** Titles for RETRIEVAL_DOCUMENT, which Gemini uses to embed a document better. */
  titles?: readonly string[];
  timeoutMs?: number;
  /** Pause between batches, to stay inside a free-tier quota. */
  delayMs?: number;
  /** Retries after a 429 or a 503, with exponential backoff. */
  retries?: number;
  signal?: AbortSignal;
};

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });

function requestFor(embedder: Embedder, texts: readonly string[], options: EmbedOptions, offset: number): { headers: Record<string, string>; body: unknown } {
  if (embedder.provider === "gemini") {
    return {
      headers: { "content-type": "application/json", "x-goog-api-key": embedder.key },
      body: {
        requests: texts.map((text, index) => ({
          model: `models/${GEMINI_MODEL}`,
          content: { parts: [{ text }] },
          taskType: options.task,
          ...(options.task === "RETRIEVAL_DOCUMENT" && options.titles?.[offset + index] ? { title: options.titles[offset + index] } : {}),
          outputDimensionality: EMBED_DIMENSIONS,
        })),
      },
    };
  }
  return {
    headers: { "content-type": "application/json", authorization: `Bearer ${embedder.key}` },
    body: { model: embedder.model, input: texts, dimensions: EMBED_DIMENSIONS, encoding_format: "float" },
  };
}

function vectorsFrom(embedder: Embedder, raw: unknown): number[][] | null {
  const body = raw as { embeddings?: { values?: unknown }[]; data?: { embedding?: unknown; index?: number }[] };
  const list = embedder.provider === "gemini"
    ? body?.embeddings?.map((item) => item.values)
    : body?.data?.slice().sort((left, right) => (left.index ?? 0) - (right.index ?? 0)).map((item) => item.embedding);
  if (!Array.isArray(list)) return null;
  const vectors: number[][] = [];
  for (const values of list) {
    if (!Array.isArray(values) || values.length !== EMBED_DIMENSIONS || !values.every((value) => typeof value === "number")) return null;
    vectors.push(l2Normalize(values as number[]));
  }
  return vectors;
}

/**
 * How long to wait after a 429 or 503: the Retry-After header, else Gemini's RetryInfo `retryDelay` ("37s") from the
 * error body (its free tier counts per minute), else exponential backoff. Never more than a minute.
 */
async function retryWait(response: Response, attempt: number) {
  const header = Number(response.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return Math.min(header * 1000, 60_000);
  const body = (await response.json().catch(() => null)) as { error?: { details?: { retryDelay?: string }[] } } | null;
  const hint = body?.error?.details?.find((detail) => typeof detail.retryDelay === "string")?.retryDelay;
  const seconds = hint ? Number.parseFloat(hint) : NaN;
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000 + 500, 60_000);
  return Math.min(1000 * 2 ** attempt, 60_000);
}

async function embedBatch(embedder: Embedder, texts: readonly string[], options: EmbedOptions, offset: number): Promise<number[][]> {
  const retries = options.retries ?? 3;
  const { headers, body } = requestFor(embedder, texts, options, offset);
  for (let attempt = 0; ; attempt += 1) {
    const timeout = AbortSignal.timeout(options.timeoutMs ?? 20_000);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
    const response = await fetch(embedder.url, { method: "POST", headers, body: JSON.stringify(body), signal });
    if ((response.status === 429 || response.status === 503) && attempt < retries) {
      await sleep(await retryWait(response, attempt), options.signal);
      continue;
    }
    const raw = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    if (!response.ok) {
      const message = (raw?.error?.message ?? "").replaceAll(embedder.key, "[key]").slice(0, 180);
      throw new Error(`embedding request failed (${response.status}) ${message}`);
    }
    const vectors = vectorsFrom(embedder, raw);
    if (!vectors || vectors.length !== texts.length) throw new Error("embedding reply was not one vector per text");
    return vectors;
  }
}

/** One normalised 768-dimension vector per text, in order. Throws when the provider fails after its retries. */
export async function embedTexts(embedder: Embedder, texts: readonly string[], options: EmbedOptions): Promise<number[][]> {
  const out: number[][] = [];
  for (let offset = 0; offset < texts.length; offset += embedder.batchSize) {
    if (offset > 0 && options.delayMs) await sleep(options.delayMs, options.signal);
    const batch = texts.slice(offset, offset + embedder.batchSize).map((text) => text.slice(0, 8000));
    out.push(...(await embedBatch(embedder, batch, options, offset)));
  }
  return out;
}
