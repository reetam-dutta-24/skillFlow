-- Explain-back integrity: flagged answers per learner per stage (lib/explain/authenticity.ts). Counts only, never text.
-- Additive only, safe to re-run. Rows cascade when the user or the stage is deleted.
CREATE TABLE IF NOT EXISTS "ExplainBackIntegrity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "strikes" INTEGER NOT NULL DEFAULT 0,
    "lastFlaggedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExplainBackIntegrity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExplainBackIntegrity_userId_stageId_key" ON "ExplainBackIntegrity"("userId", "stageId");

DO $$ BEGIN
  ALTER TABLE "ExplainBackIntegrity" ADD CONSTRAINT "ExplainBackIntegrity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ExplainBackIntegrity" ADD CONSTRAINT "ExplainBackIntegrity_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "RoadmapStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
