-- Dopamine Detox: the baseline self-check, weekly check-ins, focus sessions, and two profile switches.
-- Additive only, safe to re-run. Every table cascades when the user is deleted.
ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "showDetoxOnProfile" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "notifyDetox" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "DetoxAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "baselineScore" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "guidance" JSONB,
    "guidanceAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DetoxAssessment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DetoxAssessment_userId_key" ON "DetoxAssessment"("userId");

CREATE TABLE IF NOT EXISTS "DetoxCheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "screenTimeBand" TEXT NOT NULL,
    "focusRating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DetoxCheckIn_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DetoxCheckIn_userId_weekStart_key" ON "DetoxCheckIn"("userId", "weekStart");

CREATE TABLE IF NOT EXISTS "FocusSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "plannedMinutes" INTEGER NOT NULL DEFAULT 25,
    "focusedMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FocusSession_userId_endedAt_idx" ON "FocusSession"("userId", "endedAt");

DO $$ BEGIN
  ALTER TABLE "DetoxAssessment" ADD CONSTRAINT "DetoxAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "DetoxCheckIn" ADD CONSTRAINT "DetoxCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
