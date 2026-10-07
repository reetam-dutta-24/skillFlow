-- Onboarding profile fields. Additive only: existing columns and tables are left as they are.
ALTER TABLE "LearnerProfile"
ADD COLUMN "ageRange" TEXT,
ADD COLUMN "guardianConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stage" TEXT,
ADD COLUMN "experience" TEXT,
ADD COLUMN "weeklyHours" INTEGER,
ADD COLUMN "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "formats" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "headline" TEXT;

-- Career-fit test: IPIP-NEO-120 and the O*NET Interest Profiler Short Form. One row per learner.
CREATE TABLE "CareerAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "scores" JSONB,
    "report" JSONB,
    "version" TEXT NOT NULL DEFAULT 'ipip-neo-120+onet-ip-sf-60/v1',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerAssessment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CareerAssessment_userId_key" ON "CareerAssessment"("userId");

ALTER TABLE "CareerAssessment" ADD CONSTRAINT "CareerAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
