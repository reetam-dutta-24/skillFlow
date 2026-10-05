-- Practice notes belong to a skill, not a stage, and do not pass the path.

ALTER TABLE "LearnerNote" ALTER COLUMN "stageId" DROP NOT NULL;
ALTER TABLE "LearnerNote" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'stage';
ALTER TABLE "LearnerNote" ADD COLUMN "practiceKey" TEXT;

CREATE UNIQUE INDEX "LearnerNote_practiceKey_key" ON "LearnerNote"("practiceKey");
