-- One question per learner on a published post. The author answers it.

CREATE TABLE "ContributionQuestion" (
  "id" TEXT NOT NULL,
  "contributionId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "answer" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "answeredAt" TIMESTAMP(3),

  CONSTRAINT "ContributionQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContributionQuestion_contributionId_authorId_key" ON "ContributionQuestion"("contributionId", "authorId");
CREATE INDEX "ContributionQuestion_contributionId_createdAt_idx" ON "ContributionQuestion"("contributionId", "createdAt");

ALTER TABLE "ContributionQuestion" ADD CONSTRAINT "ContributionQuestion_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "CommunityContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContributionQuestion" ADD CONSTRAINT "ContributionQuestion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
