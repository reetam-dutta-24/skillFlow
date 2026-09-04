import * as React from "react";

/**
 * The explain-back milestone gate — SkillFlow's core differentiator and
 * entirely new (no AniVerse equivalent). A calm, single-column check-in:
 * the user explains a concept, the AI asks one targeted follow-up in a
 * distinct callout, the user responds, and the result is a written pass or
 * needs-improvement verdict — never just a checkmark.
 *
 * @startingPoint section="Learning" subtitle="Explain-back milestone gate" viewport="760x600"
 */
export interface ExplainBackGateProps extends React.HTMLAttributes<HTMLElement> {
  /** Context header, e.g. "Stage 2 · Hooks & State". */
  stage: React.ReactNode;
  /** The concept being checked. */
  concept: React.ReactNode;
  prompt?: React.ReactNode;
  answer?: string;
  onAnswerChange?: (value: string) => void;
  onSubmitAnswer?: () => void;
  /** The AI's targeted follow-up; rendering it reveals the second input. */
  followUp?: React.ReactNode;
  followUpAnswer?: string;
  onFollowUpChange?: (value: string) => void;
  onSubmitFollowUp?: () => void;
  result?: "pass" | "needs-improvement";
  /** Specific written feedback — required whenever `result` is set. */
  resultFeedback?: React.ReactNode;
  onContinue?: () => void;
  onRetry?: () => void;
  voiceEnabled?: boolean;
  onVoice?: () => void;
}
export function ExplainBackGate(props: ExplainBackGateProps): React.JSX.Element;
