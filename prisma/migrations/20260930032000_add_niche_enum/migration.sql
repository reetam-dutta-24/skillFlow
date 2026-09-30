-- CreateEnum
CREATE TYPE "Niche" AS ENUM ('full-stack-web-dev', 'art-painting', 'content-creation', 'photography', 'music-production');

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN "niche" "Niche";

UPDATE "Skill" SET "niche" = "slug"::"Niche";

ALTER TABLE "Skill" ALTER COLUMN "niche" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Skill_niche_key" ON "Skill"("niche");
