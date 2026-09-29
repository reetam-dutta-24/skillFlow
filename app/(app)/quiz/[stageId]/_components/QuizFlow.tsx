"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { ProgressBar } from "@/components/core/ProgressBar.jsx";
import { QuizResults, type QuizAnswer } from "./QuizResults";

export type QuizFlowQuestion = {
  id: string;
  prompt: string;
  sourceTitle: string;
  explanation: string;
  correctOptionId: string;
  options: { id: string; label: string }[];
};

const CHECK_DELAY_MS = 700;

export function QuizFlow({
  questions,
  passThreshold,
  lessonHref,
  explainHref,
}: {
  questions: QuizFlowQuestion[];
  passThreshold: number;
  lessonHref: string;
  explainHref: string;
}) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFocus = useRef(true);
  const question = questions[index];
  const total = questions.length;
  const correct = question ? checked && choice === question.correctOptionId : false;

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    if (!showResults) headingRef.current?.focus();
  }, [index, showResults]);

  function checkAnswer() {
    if (!choice || !question || pending || checked) return;
    const optionId = choice;
    const questionId = question.id;
    setPending(true);
    timer.current = setTimeout(() => {
      setPending(false);
      setChecked(true);
      setAnswers((current) => [...current.filter((item) => item.questionId !== questionId), { questionId, optionId }]);
    }, CHECK_DELAY_MS);
  }

  function nextQuestion() {
    if (timer.current) clearTimeout(timer.current);
    setIndex((current) => current + 1);
    setChoice(null);
    setChecked(false);
    setPending(false);
  }

  function retry() {
    if (timer.current) clearTimeout(timer.current);
    setAnswers([]);
    setIndex(0);
    setChoice(null);
    setChecked(false);
    setPending(false);
    setShowResults(false);
  }

  if (showResults) {
    return (
      <QuizResults
        questions={questions}
        answers={answers}
        passThreshold={passThreshold}
        lessonHref={lessonHref}
        explainHref={explainHref}
        onRetry={retry}
      />
    );
  }

  if (!question) return null;

  return (
    <section className="sf-quiz-card" aria-labelledby="quiz-question">
      <ProgressBar value={index + 1} max={total} height={4} label={`Question ${index + 1} of ${total}`} />
      <h2 id="quiz-question" ref={headingRef} tabIndex={-1}>
        {question.prompt}
      </h2>
      <div className="sf-quiz-options" role="radiogroup" aria-labelledby="quiz-question">
        {question.options.map((option, optionIndex) => {
          const isRight = checked && option.id === question.correctOptionId;
          const isWrong = checked && choice === option.id && option.id !== question.correctOptionId;
          const className = ["sf-quiz-option", isRight ? "is-right" : "", isWrong ? "is-wrong" : ""].filter(Boolean).join(" ");
          return (
            <label key={option.id} className={className}>
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={choice === option.id}
                disabled={checked || pending}
                onChange={() => setChoice(option.id)}
              />
              <span className="sf-quiz-letter" aria-hidden="true">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span className="sf-quiz-option-label">{option.label}</span>
              {isRight ? <Icon name="check" size={16} color="var(--state-pass)" strokeWidth={3} /> : null}
              {isWrong ? <Icon name="x" size={16} color="var(--state-fail)" strokeWidth={3} /> : null}
            </label>
          );
        })}
      </div>
      <div className="sf-quiz-live" aria-live="polite">
        {pending ? <p>Checking your answer.</p> : null}
        {checked && correct ? <p className="sf-quiz-ok">Correct.</p> : null}
        {checked && !correct ? (
          <div className="sf-quiz-miss">
            {question.sourceTitle ? <p className="sf-quiz-miss-kicker">From {question.sourceTitle}</p> : null}
            <p>{question.explanation}</p>
          </div>
        ) : null}
      </div>
      {checked ? (
        index < total - 1 ? (
          <Button variant="gradient" size="lg" onClick={nextQuestion}>
            Next question
            <Icon name="arrow-right" size={15} color="var(--text-on-accent)" />
          </Button>
        ) : (
          <Button variant="gradient" size="lg" onClick={() => setShowResults(true)}>
            See results
          </Button>
        )
      ) : (
        <Button variant="gradient" size="lg" disabled={!choice || pending} aria-busy={pending || undefined} onClick={checkAnswer}>
          {pending ? "Checking…" : "Check answer"}
        </Button>
      )}
    </section>
  );
}
