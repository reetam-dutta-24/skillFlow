-- CreateEnum
CREATE TYPE "CreatorWorkFormat" AS ENUM ('SHORT', 'VIDEO');

-- CreateEnum
CREATE TYPE "CreatorWorkStatus" AS ENUM ('DRAFT', 'PENDING', 'LIVE', 'REJECTED');

-- CreateTable
CREATE TABLE "CreatorWork" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "format" "CreatorWorkFormat" NOT NULL,
    "status" "CreatorWorkStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "rightsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorView" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "viewerId" TEXT,
    "watchedSec" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorWork_ownerId_updatedAt_idx" ON "CreatorWork"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "CreatorWork_skillId_status_idx" ON "CreatorWork"("skillId", "status");

-- CreateIndex
CREATE INDEX "CreatorView_workId_idx" ON "CreatorView"("workId");

-- AddForeignKey
ALTER TABLE "CreatorWork" ADD CONSTRAINT "CreatorWork_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorWork" ADD CONSTRAINT "CreatorWork_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorWork" ADD CONSTRAINT "CreatorWork_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorView" ADD CONSTRAINT "CreatorView_workId_fkey" FOREIGN KEY ("workId") REFERENCES "CreatorWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorView" ADD CONSTRAINT "CreatorView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
