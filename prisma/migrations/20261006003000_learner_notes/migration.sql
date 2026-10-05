-- Notes kept from an accepted explain-back idea.

CREATE TABLE IF NOT EXISTS "LearnerNote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "stageId" TEXT NOT NULL,
  "concept" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "review" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearnerNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LearnerNote_userId_stageId_concept_key" ON "LearnerNote"("userId", "stageId", "concept");
CREATE INDEX IF NOT EXISTS "LearnerNote_userId_updatedAt_idx" ON "LearnerNote"("userId", "updatedAt");

DO $$ BEGIN
  ALTER TABLE "LearnerNote" ADD CONSTRAINT "LearnerNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LearnerNote" ADD CONSTRAINT "LearnerNote_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LearnerNote" ADD CONSTRAINT "LearnerNote_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "RoadmapStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
