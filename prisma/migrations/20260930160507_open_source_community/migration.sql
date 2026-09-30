-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('RESOURCE', 'CONCEPT_NOTE', 'LEARNING_PATH', 'FOLLOW');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('OPEN', 'CHANGES_REQUESTED', 'MERGED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Disclosure" AS ENUM ('NONE', 'I_MADE_THIS', 'AFFILIATE_OR_SPONSORED');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVE', 'REQUEST_CHANGES', 'CLOSE');

-- CreateEnum
CREATE TYPE "ReviewReason" AS ENUM ('OFF_TOPIC', 'LOW_QUALITY', 'DUPLICATE', 'BROKEN_LINK', 'UNDISCLOSED_PROMOTION', 'INACCURATE', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunityRoleType" AS ENUM ('REVIEWER', 'MAINTAINER');

-- CreateEnum
CREATE TYPE "GapStatus" AS ENUM ('OPEN', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "LinkCheckStatus" AS ENUM ('OK', 'UNREACHABLE', 'NOT_CHECKED');

-- CreateTable
CREATE TABLE "CommunityContribution" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "authorId" TEXT,
    "type" "ContributionType" NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "url" TEXT,
    "normalizedUrl" TEXT,
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "steps" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stageId" TEXT,
    "disclosure" "Disclosure" NOT NULL,
    "gapId" TEXT,
    "linkStatus" "LinkCheckStatus" NOT NULL DEFAULT 'NOT_CHECKED',
    "linkCheckedAt" TIMESTAMP(3),
    "usefulCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "mergedAt" TIMESTAMP(3),
    "mergedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionReview" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "decision" "ReviewDecision" NOT NULL,
    "reason" "ReviewReason",
    "feedback" TEXT,
    "revision" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContributionReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsefulMark" (
    "userId" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsefulMark_pkey" PRIMARY KEY ("userId","contributionId")
);

-- CreateTable
CREATE TABLE "ContributionView" (
    "userId" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContributionView_pkey" PRIMARY KEY ("userId","contributionId")
);

-- CreateTable
CREATE TABLE "CommunityMembership" (
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMembership_pkey" PRIMARY KEY ("userId","skillId")
);

-- CreateTable
CREATE TABLE "CommunityRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "role" "CommunityRoleType" NOT NULL,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GapReport" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "stageId" TEXT,
    "authorId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "GapStatus" NOT NULL DEFAULT 'OPEN',
    "goodFirst" BOOLEAN NOT NULL DEFAULT false,
    "resolvedByContributionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GapReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityContribution_skillId_status_mergedAt_idx" ON "CommunityContribution"("skillId", "status", "mergedAt");

-- CreateIndex
CREATE INDEX "CommunityContribution_skillId_status_usefulCount_idx" ON "CommunityContribution"("skillId", "status", "usefulCount");

-- CreateIndex
CREATE INDEX "CommunityContribution_authorId_createdAt_idx" ON "CommunityContribution"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityContribution_status_createdAt_idx" ON "CommunityContribution"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityContribution_skillId_normalizedUrl_key" ON "CommunityContribution"("skillId", "normalizedUrl");

-- CreateIndex
CREATE INDEX "ContributionReview_contributionId_createdAt_idx" ON "ContributionReview"("contributionId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityMembership_skillId_idx" ON "CommunityMembership"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityRole_userId_skillId_role_key" ON "CommunityRole"("userId", "skillId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "GapReport_resolvedByContributionId_key" ON "GapReport"("resolvedByContributionId");

-- CreateIndex
CREATE INDEX "GapReport_skillId_status_createdAt_idx" ON "GapReport"("skillId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "CommunityContribution" ADD CONSTRAINT "CommunityContribution_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityContribution" ADD CONSTRAINT "CommunityContribution_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityContribution" ADD CONSTRAINT "CommunityContribution_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "RoadmapStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityContribution" ADD CONSTRAINT "CommunityContribution_gapId_fkey" FOREIGN KEY ("gapId") REFERENCES "GapReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityContribution" ADD CONSTRAINT "CommunityContribution_mergedById_fkey" FOREIGN KEY ("mergedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionReview" ADD CONSTRAINT "ContributionReview_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "CommunityContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionReview" ADD CONSTRAINT "ContributionReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsefulMark" ADD CONSTRAINT "UsefulMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsefulMark" ADD CONSTRAINT "UsefulMark_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "CommunityContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionView" ADD CONSTRAINT "ContributionView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionView" ADD CONSTRAINT "ContributionView_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "CommunityContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMembership" ADD CONSTRAINT "CommunityMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMembership" ADD CONSTRAINT "CommunityMembership_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityRole" ADD CONSTRAINT "CommunityRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityRole" ADD CONSTRAINT "CommunityRole_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityRole" ADD CONSTRAINT "CommunityRole_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GapReport" ADD CONSTRAINT "GapReport_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GapReport" ADD CONSTRAINT "GapReport_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "RoadmapStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GapReport" ADD CONSTRAINT "GapReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GapReport" ADD CONSTRAINT "GapReport_resolvedByContributionId_fkey" FOREIGN KEY ("resolvedByContributionId") REFERENCES "CommunityContribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
