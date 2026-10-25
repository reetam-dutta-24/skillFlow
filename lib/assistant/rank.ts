/**
 * Hybrid ranking for the assistant, in plain code with unit tests: Reciprocal Rank Fusion of the vector list and the
 * full-text list, a small boost for the learner's own niches and stage, at most two chunks per source, and a
 * relevance floor. Tuned with scripts/assistant-eval.ts; the numbers are recorded in README.md.
 */

/** RRF constant. Larger k flattens the difference between rank 1 and rank 10. 60 is the value from the RRF paper. */
export const RRF_K = 60;
/** How many candidates each retriever returns before fusion. */
export const CANDIDATES = 20;
/** Sources handed to the model. */
export const MAX_SOURCES = 6;
export const MAX_PER_SOURCE = 2;
/**
 * Added to the fused score. Rank 1 in one list scores 1/61 = 0.0164 and rank 20 scores 1/80 = 0.0125, so a followed
 * niche lifts a chunk several places within one list and the current stage a few more. Both together (0.006) still
 * cannot lift a chunk only one retriever found above one both retrievers agree on (2/62 = 0.032).
 */
export const BOOST_FOLLOWED = 0.002;
export const BOOST_CURRENT_STAGE = 0.004;
/** A vector hit counts as relevant at or above this cosine similarity (gemini-embedding-001, 768 dimensions). */
export const MIN_COSINE = 0.6;
/** A keyword hit counts as relevant when it covers at least this share of the question's content words. */
export const MIN_COVERAGE = 0.5;
/**
 * Added to the fused score per unit of coverage, so among chunks the retrievers ranked close together, the one that
 * covers more of the question wins (it matters most when only the keyword list is available).
 */
export const COVERAGE_WEIGHT = 0.006;

export type Candidate = {
  id: string;
  kind: string;
  refId: string;
  sourceKey: string;
  skillId: string | null;
  stageId: string | null;
  title: string;
  url: string;
  lessonUrl: string | null;
  text: string;
  monetized: boolean;
  /** Cosine similarity from the vector search, when this chunk came back from it. */
  cosine?: number;
  /** ts_rank_cd from the full-text search, when this chunk came back from it. */
  ftsRank?: number;
};

export type Ranked = Candidate & {
  score: number;
  vectorRank: number | null;
  textRank: number | null;
  coverage: number;
  /** How many of the question's content words the chunk contains. */
  coverageHits?: number;
  /** How many content words the question has. */
  questionTerms?: number;
};

const STOP = new Set(
  "a an the and or but if then so to of in on at by for with from as is are was were be been being do does did doing have has had having i me my mine we our you your it its this that these those there here what which who whom whose when where why how can could should would will shall may might must not no yes am about into over under again more most some any each other than too very just also only own same such get got give tell show explain define describe mean means meaning skillflow please myself yourself like want need good best really thing things something anything way ways".split(" "),
);

/** Crude stemming, good enough to match "promotes" with "promotion" and "passed" with "pass". */
export function stem(word: string) {
  let out = word;
  for (const suffix of ["ations", "ation", "ings", "ing", "ions", "ion", "ies", "es", "ed", "ly", "s", "e"]) {
    if (out.length - suffix.length >= 4 && out.endsWith(suffix)) {
      out = out.slice(0, -suffix.length);
      break;
    }
  }
  return out;
}

/** Lower-case content words of a text, stemmed, without stop words. */
export function contentTerms(text: string): string[] {
  const seen = new Set<string>();
  for (const raw of text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").split(" ")) {
    if (raw.length < 3 || STOP.has(raw)) continue;
    seen.add(stem(raw));
  }
  return [...seen];
}

/** How many of the question's content words appear in the chunk (as a word prefix after stemming), and the share. */
export function coverageDetail(question: string, chunkText: string) {
  const terms = contentTerms(question);
  if (terms.length === 0) return { ratio: 0, hits: 0, terms: 0 };
  const hay = new Set(contentTerms(chunkText));
  const words = [...hay];
  const hits = terms.filter((term) => hay.has(term) || words.some((word) => word.startsWith(term) || (word.length >= 4 && term.startsWith(word)))).length;
  return { ratio: hits / terms.length, hits, terms: terms.length };
}

/** Share of the question's content words that appear in the chunk. */
export function coverage(question: string, chunkText: string) {
  return coverageDetail(question, chunkText).ratio;
}

/** The OR query for Postgres to_tsquery: sanitised words only, so nothing the learner types becomes tsquery syntax. */
export function orTsQuery(question: string) {
  const words = [...new Set(question.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").split(" "))]
    .filter((word) => word.length >= 3 && !STOP.has(word))
    .slice(0, 16);
  return words.join(" | ");
}

/** Reciprocal Rank Fusion: each list contributes 1 / (k + rank) for every chunk it holds. */
export function fuse(vector: readonly Candidate[], text: readonly Candidate[], k = RRF_K): Ranked[] {
  const merged = new Map<string, Ranked>();
  const add = (list: readonly Candidate[], which: "vectorRank" | "textRank") => {
    list.forEach((candidate, index) => {
      const rank = index + 1;
      const existing = merged.get(candidate.id);
      const row: Ranked = existing ?? { ...candidate, score: 0, vectorRank: null, textRank: null, coverage: 0 };
      row.score += 1 / (k + rank);
      row[which] = rank;
      if (candidate.cosine !== undefined) row.cosine = candidate.cosine;
      if (candidate.ftsRank !== undefined) row.ftsRank = candidate.ftsRank;
      merged.set(candidate.id, row);
    });
  };
  add(vector, "vectorRank");
  add(text, "textRank");
  return [...merged.values()].sort((left, right) => right.score - left.score);
}

export function boost(rows: readonly Ranked[], context: { followedSkillIds: ReadonlySet<string>; currentStageIds: ReadonlySet<string> }) {
  return rows
    .map((row) => {
      let score = row.score;
      if (row.skillId && context.followedSkillIds.has(row.skillId)) score += BOOST_FOLLOWED;
      if (row.stageId && context.currentStageIds.has(row.stageId)) score += BOOST_CURRENT_STAGE;
      return { ...row, score };
    })
    .sort((left, right) => right.score - left.score);
}

/**
 * A chunk is kept only when one retriever found it clearly relevant, not merely ranked: a close vector, or a chunk
 * that covers enough of the question. A question of two or more content words needs two of them in the chunk, so one
 * shared common word ("capital", "series") is never enough.
 */
export function relevant(row: Pick<Ranked, "cosine" | "coverage" | "coverageHits" | "questionTerms">, minCosine = MIN_COSINE, minCoverage = MIN_COVERAGE) {
  if ((row.cosine ?? 0) >= minCosine) return true;
  const enoughWords = row.questionTerms === undefined || row.questionTerms < 2 || (row.coverageHits ?? 0) >= 2;
  return row.coverage >= minCoverage && enoughWords;
}

/** What counts as one source for the per-source cap: a resource with its transcript, or one help article. */
export function sourceGroup(row: Pick<Candidate, "kind" | "refId">) {
  return row.kind === "transcript" ? `resource|${row.refId}` : `${row.kind}|${row.refId}`;
}

/** Relevance floor, at most two chunks per source, then the top few. */
export function select(rows: readonly Ranked[], options: { max?: number; perSource?: number; minCosine?: number; minCoverage?: number } = {}) {
  const max = options.max ?? MAX_SOURCES;
  const perSource = options.perSource ?? MAX_PER_SOURCE;
  const counts = new Map<string, number>();
  const kept: Ranked[] = [];
  for (const row of rows) {
    if (!relevant(row, options.minCosine, options.minCoverage)) continue;
    const group = sourceGroup(row);
    const used = counts.get(group) ?? 0;
    if (used >= perSource) continue;
    counts.set(group, used + 1);
    kept.push(row);
    if (kept.length >= max) break;
  }
  return kept;
}

/** Premium boundary, the same rule the SQL WHERE clause applies: a monetized chunk needs Premium. */
export function visibleTo(chunk: Pick<Candidate, "monetized">, premium: boolean) {
  return premium || !chunk.monetized;
}
