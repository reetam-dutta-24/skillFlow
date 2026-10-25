/** Vector helpers shared by the indexer, retrieval, and the tests. Plain code. */

export const EMBED_DIMENSIONS = 768;

/**
 * Unit length, so cosine similarity is a dot product. gemini-embedding-001 only normalises its full 3072-dimension
 * output; a truncated 768-dimension vector must be normalised here before it is stored or compared.
 */
export function l2Normalize(values: readonly number[]): number[] {
  let sum = 0;
  for (const value of values) sum += value * value;
  const norm = Math.sqrt(sum);
  if (!Number.isFinite(norm) || norm === 0) return values.map(() => 0);
  return values.map((value) => value / norm);
}

/** pgvector's text form, sent as one bound parameter and cast with ::vector in SQL. Never built into the SQL string. */
export function toVectorLiteral(values: readonly number[]): string {
  if (values.length !== EMBED_DIMENSIONS) throw new Error(`expected ${EMBED_DIMENSIONS} dimensions, got ${values.length}`);
  return `[${values.map((value) => (Number.isFinite(value) ? Number(value.toFixed(7)) : 0)).join(",")}]`;
}

export function cosine(left: readonly number[], right: readonly number[]) {
  let dot = 0;
  let a = 0;
  let b = 0;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    dot += left[index] * right[index];
    a += left[index] * left[index];
    b += right[index] * right[index];
  }
  return a && b ? dot / Math.sqrt(a * b) : 0;
}
