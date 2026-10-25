import "server-only";
import { randomUUID } from "node:crypto";
import { chunkKey, textHash, type KnowledgeChunkInput } from "@/lib/assistant/chunk";
import { loadCatalogChunks, loadHelpChunks, loadResourceChunks } from "@/lib/assistant/corpus";
import { embedTexts, embedderConfig, type Embedder } from "@/lib/assistant/embed";
import { toVectorLiteral } from "@/lib/assistant/vector";
import { prisma } from "@/lib/prisma";

/**
 * Writes retrieval chunks. Idempotent: a chunk is embedded only when its text hash changed, its vector is missing, or
 * it was embedded by another model; a chunk whose source disappeared is deleted. Without an embedding key a chunk is
 * still stored (text only) so keyword retrieval works, and counted as skipped until a later run embeds it.
 * Every statement is a tagged-template $queryRaw/$executeRaw: values are bound parameters, never spliced into SQL.
 */

type ExistingRow = { id: string; kind: string; refId: string; chunkIndex: number; textHash: string; model: string | null; hasVector: boolean };

export type SyncCounts = { embedded: number; unchanged: number; deleted: number; skipped: number };

async function existingRows(scope?: { refId: string }): Promise<ExistingRow[]> {
  if (scope) {
    return prisma.$queryRaw<ExistingRow[]>`
      SELECT id, kind, "refId", "chunkIndex", "textHash", model, (vector IS NOT NULL) AS "hasVector"
      FROM "KnowledgeChunk" WHERE "refId" = ${scope.refId} AND kind IN ('resource', 'transcript')`;
  }
  return prisma.$queryRaw<ExistingRow[]>`
    SELECT id, kind, "refId", "chunkIndex", "textHash", model, (vector IS NOT NULL) AS "hasVector" FROM "KnowledgeChunk"`;
}

async function upsertChunk(chunk: KnowledgeChunkInput, hash: string, model: string | null, vector: number[] | null) {
  const literal = vector ? toVectorLiteral(vector) : null;
  await prisma.$executeRaw`
    INSERT INTO "KnowledgeChunk"
      (id, kind, "refId", "chunkIndex", "sourceKey", "skillId", "stageId", monetized, title, url, "lessonUrl", text, "textHash", model, vector, "updatedAt")
    VALUES
      (${randomUUID()}, ${chunk.kind}, ${chunk.refId}, ${chunk.chunkIndex}, ${chunk.sourceKey}, ${chunk.skillId}, ${chunk.stageId},
       ${chunk.monetized}, ${chunk.title}, ${chunk.url}, ${chunk.lessonUrl}, ${chunk.text}, ${hash}, ${model}, ${literal}::vector, now())
    ON CONFLICT (kind, "refId", "chunkIndex") DO UPDATE SET
      "sourceKey" = EXCLUDED."sourceKey", "skillId" = EXCLUDED."skillId", "stageId" = EXCLUDED."stageId",
      monetized = EXCLUDED.monetized, title = EXCLUDED.title, url = EXCLUDED.url, "lessonUrl" = EXCLUDED."lessonUrl",
      text = EXCLUDED.text, "textHash" = EXCLUDED."textHash", model = EXCLUDED.model, vector = EXCLUDED.vector,
      "updatedAt" = now()`;
}

/** Metadata can change without the text changing (a niche turned Premium, a stage moved): refresh it in place. */
async function refreshMetadata(chunk: KnowledgeChunkInput) {
  await prisma.$executeRaw`
    UPDATE "KnowledgeChunk" SET "sourceKey" = ${chunk.sourceKey}, "skillId" = ${chunk.skillId}, "stageId" = ${chunk.stageId},
      monetized = ${chunk.monetized}, url = ${chunk.url}, "lessonUrl" = ${chunk.lessonUrl}
    WHERE kind = ${chunk.kind} AND "refId" = ${chunk.refId} AND "chunkIndex" = ${chunk.chunkIndex}
      AND ("sourceKey" IS DISTINCT FROM ${chunk.sourceKey} OR "skillId" IS DISTINCT FROM ${chunk.skillId}
        OR "stageId" IS DISTINCT FROM ${chunk.stageId} OR monetized IS DISTINCT FROM ${chunk.monetized}
        OR url IS DISTINCT FROM ${chunk.url} OR "lessonUrl" IS DISTINCT FROM ${chunk.lessonUrl})`;
}

export async function syncChunks(
  chunks: readonly KnowledgeChunkInput[],
  options: { embedder?: Embedder | null; delayMs?: number; scope?: { refId: string }; log?: (line: string) => void } = {},
): Promise<SyncCounts> {
  const embedder = options.embedder === undefined ? embedderConfig() : options.embedder;
  const existing = new Map((await existingRows(options.scope)).map((row) => [chunkKey(row), row]));
  const counts: SyncCounts = { embedded: 0, unchanged: 0, deleted: 0, skipped: 0 };

  const todo: { chunk: KnowledgeChunkInput; hash: string }[] = [];
  const wanted = new Set<string>();
  for (const chunk of chunks) {
    const key = chunkKey(chunk);
    if (wanted.has(key)) continue;
    wanted.add(key);
    const hash = textHash(chunk.title, chunk.text);
    const row = existing.get(key);
    const current = row && row.textHash === hash && (embedder ? row.hasVector && row.model === embedder.model : true);
    if (current) {
      await refreshMetadata(chunk);
      counts.unchanged += 1;
    } else {
      todo.push({ chunk, hash });
    }
  }

  if (embedder && todo.length) {
    // Embed in slices so one failed batch costs only that slice; the rest is still written.
    const slice = embedder.batchSize;
    for (let offset = 0; offset < todo.length; offset += slice) {
      const part = todo.slice(offset, offset + slice);
      let vectors: number[][] | null = null;
      try {
        vectors = await embedTexts(embedder, part.map((item) => item.chunk.text), {
          task: "RETRIEVAL_DOCUMENT",
          titles: part.map((item) => item.chunk.title),
          delayMs: options.delayMs,
        });
        if (offset + slice < todo.length && options.delayMs) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
      } catch (error) {
        options.log?.(`embedding failed for ${part.length} chunks: ${error instanceof Error ? error.message.slice(0, 160) : "error"}`);
      }
      for (const [index, item] of part.entries()) {
        const vector = vectors?.[index] ?? null;
        await upsertChunk(item.chunk, item.hash, vector ? embedder.model : null, vector);
        if (vector) counts.embedded += 1;
        else counts.skipped += 1;
      }
      options.log?.(`  ${Math.min(offset + slice, todo.length)} / ${todo.length} written`);
    }
  } else {
    for (const item of todo) {
      await upsertChunk(item.chunk, item.hash, null, null);
      counts.skipped += 1;
    }
  }

  const stale = [...existing.entries()].filter(([key]) => !wanted.has(key)).map(([, row]) => row.id);
  if (stale.length) {
    counts.deleted = await prisma.$executeRaw`DELETE FROM "KnowledgeChunk" WHERE id = ANY(${stale}::text[])`;
  }
  return counts;
}

/** The whole corpus: help, the tour, the feature list, and the catalog. */
export async function indexEverything(options: { delayMs?: number; log?: (line: string) => void } = {}) {
  const [help, catalog] = await Promise.all([loadHelpChunks(), loadCatalogChunks()]);
  options.log?.(`corpus: ${help.length} help chunks, ${catalog.length} catalog chunks`);
  return syncChunks([...help, ...catalog], options);
}

/**
 * Re-index one resource after an admin approves a submission or edits it. Never throws: a failed embedding is logged
 * and the chunk is stored text-only, so the approval itself is never blocked.
 */
export async function reindexResource(resourceId: string): Promise<SyncCounts | null> {
  try {
    const chunks = await loadResourceChunks(resourceId);
    return await syncChunks(chunks ?? [], { scope: { refId: resourceId }, log: (line) => console.warn("[assistant]", line) });
  } catch (error) {
    console.error("[assistant] reindex failed", resourceId, error instanceof Error ? error.message.slice(0, 180) : "error");
    return null;
  }
}
