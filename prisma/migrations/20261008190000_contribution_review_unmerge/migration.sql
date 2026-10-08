-- ContributionReview.unmerge was added to the schema and to the original development database without a
-- migration file, so a database built from these migrations alone lacked it. IF NOT EXISTS keeps this a
-- no-op where the column and index are already there.
ALTER TABLE "ContributionReview" ADD COLUMN IF NOT EXISTS "unmerge" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "ContributionReview_unmerge_createdAt_idx" ON "ContributionReview"("unmerge", "createdAt");
