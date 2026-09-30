-- Catalog fields for skills, stages, resources, and explain-back rubrics.
-- Then drop the five placeholder Full-Stack stages. Their resources and
-- submissions go with them (ON DELETE CASCADE).

CREATE TYPE "SkillStatus" AS ENUM ('AVAILABLE', 'COMING_SOON');
CREATE TYPE "StageLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
CREATE TYPE "SourceStatus" AS ENUM ('ACTIVE', 'UNAVAILABLE');

ALTER TABLE "Skill" ADD COLUMN "status" "SkillStatus" NOT NULL DEFAULT 'COMING_SOON';
UPDATE "Skill" SET "status" = 'AVAILABLE' WHERE "isFlagship" = true;

ALTER TABLE "RoadmapStage" ADD COLUMN "level" "StageLevel" NOT NULL DEFAULT 'BEGINNER';
ALTER TABLE "RoadmapStage" ADD COLUMN "learningObjectives" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Resource" ADD COLUMN "provider" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Resource" ADD COLUMN "author" TEXT;
ALTER TABLE "Resource" ADD COLUMN "videoId" TEXT;
ALTER TABLE "Resource" ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Resource" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Resource" ADD COLUMN "sourceStatus" "SourceStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Resource" ADD COLUMN "lastVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Resource" ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Resource" ALTER COLUMN "keyPoints" TYPE TEXT[] USING (
  CASE
    WHEN "keyPoints" IS NULL OR btrim("keyPoints") = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY["keyPoints"]::TEXT[]
  END
);
ALTER TABLE "Resource" ALTER COLUMN "keyPoints" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Resource" ALTER COLUMN "keyPoints" SET NOT NULL;

CREATE UNIQUE INDEX "Resource_stageId_url_key" ON "Resource"("stageId", "url");

ALTER TABLE "ExplainBackPrompt" ALTER COLUMN "rubric" TYPE TEXT[] USING (
  CASE
    WHEN btrim("rubric") = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY["rubric"]::TEXT[]
  END
);
ALTER TABLE "ExplainBackPrompt" ALTER COLUMN "rubric" SET DEFAULT ARRAY[]::TEXT[];

DELETE FROM "RoadmapStage"
WHERE "skillId" = (SELECT "id" FROM "Skill" WHERE "slug" = 'full-stack-web-dev')
  AND "title" IN (
    'React Fundamentals',
    'Hooks & State',
    'Server Actions',
    'Auth & Sessions',
    'Database & Prisma'
  );
