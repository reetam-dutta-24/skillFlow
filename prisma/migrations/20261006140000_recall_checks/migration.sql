-- A passed idea can be explained again. The stage pass is a different row.

CREATE TABLE "RecallCheck" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "noteId" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "quality" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "review" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RecallCheck_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecallCheck_userId_createdAt_idx" ON "RecallCheck"("userId", "createdAt");
CREATE INDEX "RecallCheck_noteId_createdAt_idx" ON "RecallCheck"("noteId", "createdAt");

ALTER TABLE "RecallCheck" ADD CONSTRAINT "RecallCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecallCheck" ADD CONSTRAINT "RecallCheck_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "LearnerNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
