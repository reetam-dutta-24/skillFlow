-- Saved preference for the quiet streak note in the bell.
ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "streakReminder" BOOLEAN NOT NULL DEFAULT true;
