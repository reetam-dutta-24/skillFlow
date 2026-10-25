import "server-only";
import { createHash } from "node:crypto";
import { embedTexts, embedderConfig, type Embedder } from "@/lib/assistant/embed";
import {
  CANDIDATES,
  COVERAGE_WEIGHT,
  RRF_K,
  boost,
  coverageDetail,
  fuse,
  orTsQuery,
  select,
  type Candidate,
  type Ranked,
} from "@/lib/assistant/rank";
import { toVectorLiteral } from "@/lib/assistant/vector";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

/**
 * Hybrid retrieval: the top chunks by cosine distance (HNSW) and the top chunks by full-text rank, both filtered by
 * the Premium boundary inside the SQL WHERE clause, fused with Reciprocal Rank Fusion, boosted for the learner's own
 * niches and stage, capped per source, and cut at a relevance floor. When the embedding call fails the full-text list
 * alone still answers.
 */

const QUERY_TTL_SECONDS = 60 * 60;
const QUERY_EMBED_TIMEOUT_MS = 3000;

type Row = Omit<Candidate, "cosine" | "ftsRank"> & { cosine?: number | null; ftsRank?: number | null };

function clean(rows: Row[]): Candidate[] {
  return rows.map(({ cosine, ftsRank, ...rest }) => ({
    ...rest,
    ...(cosine == null ? {} : { cosine: Number(cosine) }),
    ...(ftsRank == null ? {} : { ftsRank: Number(ftsRank) }),
  }));
}

/** The query vector, cached in Redis for an hour by model and hash. Null when there is no embedder or it fails. */
export async function queryVector(text: string, embedder: Embedder | null = embedderConfig(), signal?: AbortSignal): Promise<number[] | null> {
  if (!embedder) return null;
  const key = `as:qv:${embedder.model}:${createHash("sha256").update(text.trim().toLowerCase()).digest("hex").slice(0, 32)}`;
  const redis = getRedis();
  try {
    const cached = await redis?.get(key);
    if (cached) {
      const values = JSON.parse(cached) as unknown;
      if (Array.isArray(values)) return values as number[];
    }
  } catch {
    // A cache miss is fine.
  }
  try {
    const [vector] = await embedTexts(embedder, [text], { task: "RETRIEVAL_QUERY", timeoutMs: QUERY_EMBED_TIMEOUT_MS, retries: 0, signal });
    try {
      await redis?.set(key, JSON.stringify(vector.map((value) => Number(value.toFixed(6)))), "EX", QUERY_TTL_SECONDS);
    } catch {
      // Not cached; the next question embeds again.
    }
    return vector;
  } catch (error) {
    console.warn("[assistant] query embedding failed; using full-text only", error instanceof Error ? error.message.slice(0, 160) : "error");
    return null;
  }
}

export async function vectorSearch(vector: number[], model: string, premium: boolean, limit = CANDIDATES): Promise<Candidate[]> {
  const literal = toVectorLiteral(vector);
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT id, kind, "refId", "sourceKey", "skillId", "stageId", title, url, "lessonUrl", text, monetized,
           1 - (vector <=> ${literal}::vector) AS cosine
    FROM "KnowledgeChunk"
    WHERE vector IS NOT NULL AND model = ${model} AND (${premium} OR monetized = false)
    ORDER BY vector <=> ${literal}::vector
    LIMIT ${limit}`;
  return clean(rows);
}

export async function textSearch(question: string, premium: boolean, limit = CANDIDATES): Promise<Candidate[]> {
  const query = orTsQuery(question);
  if (!query) return [];
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT id, kind, "refId", "sourceKey", "skillId", "stageId", title, url, "lessonUrl", text, monetized,
           ts_rank_cd(tsv, q, 32) AS "ftsRank"
    FROM "KnowledgeChunk", to_tsquery('english', ${query}) AS q
    WHERE tsv @@ q AND (${premium} OR monetized = false)
    ORDER BY "ftsRank" DESC
    LIMIT ${limit}`;
  return clean(rows);
}

export type RetrievalOptions = {
  premium: boolean;
  followedSkillIds?: ReadonlySet<string>;
  currentStageIds?: ReadonlySet<string>;
  k?: number;
  max?: number;
  minCosine?: number;
  minCoverage?: number;
  coverageWeight?: number;
  signal?: AbortSignal;
  embedder?: Embedder | null;
};

export type RetrievalResult = {
  sources: Ranked[];
  /** Everything fused, before the floor and the per-source cap. The eval reads it. */
  ranked: Ranked[];
  usedVector: boolean;
};

/**
 * `question` is what is embedded and searched; `coverageText` (the question alone) decides relevance, so a follow-up
 * that borrowed the previous turn's words cannot pass the floor on those words only.
 */
export async function retrieve(question: string, options: RetrievalOptions, coverageText = question): Promise<RetrievalResult> {
  const embedder = options.embedder === undefined ? embedderConfig() : options.embedder;
  const vector = await queryVector(question, embedder, options.signal);
  const [vectorList, textList] = await Promise.all([
    vector && embedder ? vectorSearch(vector, embedder.model, options.premium).catch(() => []) : Promise.resolve([] as Candidate[]),
    textSearch(question, options.premium),
  ]);
  const weight = options.coverageWeight ?? COVERAGE_WEIGHT;
  const fused = fuse(vectorList, textList, options.k ?? RRF_K).map((row) => {
    const body = `${row.title}\n${row.text}`;
    const own = coverageDetail(coverageText, body);
    // A follow-up borrowed the previous question's words for the search; they count, at half weight, for coverage.
    const borrowed = coverageText === question ? 0 : coverageDetail(question, body).ratio * 0.5;
    const share = Math.max(own.ratio, borrowed);
    return { ...row, coverage: share, coverageHits: own.hits, questionTerms: own.terms, score: row.score + share * weight };
  });
  const ranked = boost(fused, { followedSkillIds: options.followedSkillIds ?? new Set(), currentStageIds: options.currentStageIds ?? new Set() });
  return {
    sources: select(ranked, { max: options.max, minCosine: options.minCosine, minCoverage: options.minCoverage }),
    ranked,
    usedVector: vectorList.length > 0,
  };
}
