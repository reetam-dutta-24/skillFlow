import * as React from "react";

/**
 * One question in the post-lesson quiz. New in SkillFlow. Shows immediate
 * right/wrong feedback and, on a miss, an AI explanation grounded in the
 * lesson just consumed.
 *
 * @startingPoint section="Learning" subtitle="Quiz question with feedback" viewport="700x400"
 */
export interface QuizQuestionProps extends React.HTMLAttributes<HTMLElement> {
  index?: number;
  total?: number;
  question: React.ReactNode;
  options?: React.ReactNode[];
  correctIndex?: number;
  /** Index the user picked; `null`/`undefined` means unanswered. */
  selected?: number | null;
  onSelect?: (index: number) => void;
  /** Shown only on a miss — references the lesson content. */
  explanation?: React.ReactNode;
  onNext?: () => void;
}
export function QuizQuestion(props: QuizQuestionProps): React.JSX.Element;
