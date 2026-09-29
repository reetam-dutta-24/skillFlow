"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/core/Button.jsx";
import { Chip } from "@/components/core/Chip.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import type { QuizFlowQuestion } from "./QuizFlow";

export type QuizAnswer = {
  questionId: string;
  optionId: string;
};

export function QuizResults({
  questions,
  answers,
  passThreshold,
  lessonHref,
  explainHref,
  onRetry,
}: {
  questions: QuizFlowQuestion[];
  answers: QuizAnswer[];
  passThreshold: number;
  lessonHref: string;
  explainHref: string;
  onRetry: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const total = questions.length;
  const correctCount = questions.filter((question) => {
    const answer = answers.find((item) => item.questionId === question.id);
    return answer?.optionId === question.correctOptionId;
  }).length;
  const passed = total > 0 && correctCount / total >= passThreshold;
  const passMark = Math.ceil(passThreshold * total);
  const missed = questions.filter((question) => {
    const answer = answers.find((item) => item.questionId === question.id);
    return answer?.optionId !== question.correctOptionId;
  });

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="sf-quiz-results" aria-labelledby="quiz-result">
      <div className="sf-quiz-score">
        <h2 id="quiz-result" ref={headingRef} tabIndex={-1}>
          {correctCount} of {total}
        </h2>
        <Chip tone={passed ? "pass" : "warn"} size="md">
          {passed ? "Passed" : "Not passed"}
        </Chip>
      </div>
      <p className="sf-quiz-mark">Pass mark is {passMark} of {total}.</p>
      <div className="sf-quiz-live" aria-live="polite">
        <p className="sf-quiz-status">{passed ? "You can continue to the explain-back check." : "Review the lesson, then try the quiz again."}</p>
      </div>
      {missed.length > 0 ? (
        <div className="sf-quiz-missed">
          <h3>Missed questions</h3>
          <ul>
            {missed.map((question) => (
              <li key={question.id}>
                <p className="sf-quiz-missed-prompt">{question.prompt}</p>
                {question.sourceTitle ? <p className="sf-quiz-miss-kicker">From {question.sourceTitle}</p> : null}
                <p>{question.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="sf-quiz-clear">Every answer matched the lesson.</p>
      )}
      <div className="sf-quiz-actions">
        {passed ? (
          <Link className="sf-quiz-cta" href={explainHref}>
            Continue to the explain-back check
            <Icon name="arrow-right" size={15} color="var(--text-on-accent)" />
          </Link>
        ) : (
          <>
            <Button variant="gradient" size="lg" onClick={onRetry}>
              Retry quiz
            </Button>
            <Link className="sf-quiz-review" href={lessonHref}>
              Review the lesson
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
