-- Lets a learner hide activity counts from their public profile. Additive only.
ALTER TABLE "LearnerProfile" ADD COLUMN "showActivity" BOOLEAN NOT NULL DEFAULT true;
