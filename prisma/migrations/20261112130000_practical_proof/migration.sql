-- Hands-on proof for practical paths: a link or an uploaded file and a write-up, per learner per stage.
-- Additive only, safe to re-run. Rows cascade when the user or the stage is deleted.
CREATE TABLE IF NOT EXISTS "PracticalProof" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "writeUp" TEXT NOT NULL,
    "review" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "inputMethod" TEXT NOT NULL DEFAULT 'text',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticalProof_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PracticalProof_userId_stageId_key" ON "PracticalProof"("userId", "stageId");

DO $$ BEGIN
  ALTER TABLE "PracticalProof" ADD CONSTRAINT "PracticalProof_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PracticalProof" ADD CONSTRAINT "PracticalProof_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "RoadmapStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
