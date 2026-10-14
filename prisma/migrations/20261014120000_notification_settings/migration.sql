-- Notification switches and the "mark all as read" time on the learner profile.
-- Additive only, safe to re-run.
ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "notifyReviews" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "notifyCommunity" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "notificationsReadAt" TIMESTAMP(3);
