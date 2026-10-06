-- Personal plans sit on the shared catalog. Tag fields start empty.

CREATE TYPE "ResourceDepth" AS ENUM ('INTRO', 'STANDARD', 'DEEP');

ALTER TABLE "Resource" ADD COLUMN "durationMinutes" INTEGER;
ALTER TABLE "Resource" ADD COLUMN "depth" "ResourceDepth";
ALTER TABLE "Resource" ADD COLUMN "isCore" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Resource" ADD COLUMN "captionLanguages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Resource" ADD COLUMN "tagOrigins" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE "LearningPlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "preferences" JSONB NOT NULL,
  "plan" JSONB NOT NULL,
  "catalogStamp" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LearningPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearningPlan_userId_skillId_key" ON "LearningPlan"("userId", "skillId");

ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
