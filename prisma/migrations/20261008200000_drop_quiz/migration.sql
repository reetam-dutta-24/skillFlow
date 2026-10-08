-- Quizzes were removed from the product on 1 Oct 2026.
-- The explain-back gate is the only mastery check, so these tables are dead.

-- Children first: QuizAttempt and QuizQuestion point at Quiz.
DROP TABLE IF EXISTS "QuizAttempt";
DROP TABLE IF EXISTS "QuizQuestion";
DROP TABLE IF EXISTS "Quiz";

ALTER TABLE "StageCompletion" DROP COLUMN IF EXISTS "quizPassed";