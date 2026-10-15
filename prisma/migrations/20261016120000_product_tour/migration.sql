-- When the Home product tour was finished or skipped. Null keeps the invite card on Home.
-- Additive only, safe to re-run.
ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "tourCompletedAt" TIMESTAMP(3);
