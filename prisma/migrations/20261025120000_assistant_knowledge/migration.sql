-- SkillFlow Assistant: retrieval chunks with a 768-dimension embedding (pgvector) and a full-text column.
-- Additive only, safe to re-run: a new extension, a new table, and new indexes. Nothing existing changes.
-- Needs the pgvector extension in the server image (pgvector/pgvector:pg16).
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "sourceKey" TEXT NOT NULL,
    "skillId" TEXT,
    "stageId" TEXT,
    "monetized" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "lessonUrl" TEXT,
    "text" TEXT NOT NULL,
    "textHash" TEXT NOT NULL,
    "model" TEXT,
    "vector" vector(768),
    "tsv" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english'::regconfig, coalesce("title", '')), 'A') ||
        setweight(to_tsvector('english'::regconfig, coalesce("text", '')), 'B')
    ) STORED,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeChunk_kind_refId_chunkIndex_key" ON "KnowledgeChunk"("kind", "refId", "chunkIndex");
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_textHash_idx" ON "KnowledgeChunk"("textHash");
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_sourceKey_idx" ON "KnowledgeChunk"("sourceKey");

-- Approximate nearest neighbours on cosine distance (the vectors are unit length).
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_vector_hnsw_idx" ON "KnowledgeChunk" USING hnsw ("vector" vector_cosine_ops);

-- Keyword retrieval with ts_rank_cd.
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_tsv_idx" ON "KnowledgeChunk" USING gin ("tsv");
