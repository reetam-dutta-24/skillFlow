"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ExplainBackGate } from "@/components/learning/ExplainBackGate.jsx";
import { ErrorState } from "@/components/feedback/ErrorState.jsx";
import { reviewExplanation } from "../actions";

const MOCK_TRANSCRIPT =
  "The dependency array is the list of values the effect reads. React can skip the effect when those values have not changed.";

const TRANSCRIBE_MS = 2000;

export function ExplainBackForm({
  stageId,
  stageLabel,
  question,
  continueHref,
  continueLabel,
}: {
  stageId: string;
  stageLabel: string;
  question: string;
  continueHref: string;
  continueLabel: string;
}) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [quote, setQuote] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [result, setResult] = useState<"pass" | "needs-improvement" | undefined>(undefined);
  const [feedback, setFeedback] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [phase, setPhase] = useState<"idle" | "recording" | "transcribing">("idle");
  const [voiceNote, setVoiceNote] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sawFollowUp = useRef(false);
  const sawResult = useRef(false);
  const voiceReady = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.mediaDevices?.getUserMedia === "function",
    () => false,
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (followUp && !sawFollowUp.current) {
      sawFollowUp.current = true;
      document.getElementById("explain-follow-up")?.focus();
    }
    if (!followUp) sawFollowUp.current = false;
  }, [followUp]);

  useEffect(() => {
    if (result && !sawResult.current) {
      sawResult.current = true;
      document.getElementById("explain-result")?.focus();
    }
    if (!result) sawResult.current = false;
  }, [result]);

  function chooseMode(next: "text" | "voice") {
    if (reviewing) return;
    if (timer.current) clearTimeout(timer.current);
    setMode(next);
    setPhase("idle");
    if (next === "text") setVoiceNote("");
  }

  async function startRecording() {
    setVoiceNote("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPhase("recording");
    } catch {
      setMode("text");
      setPhase("idle");
      setVoiceNote("The microphone is blocked. You can type the explanation instead.");
    }
  }

  function stopRecording() {
    setPhase("transcribing");
    timer.current = setTimeout(() => {
      setAnswer(MOCK_TRANSCRIPT);
      setPhase("idle");
    }, TRANSCRIBE_MS);
  }

  async function submitAnswer() {
    if (reviewing || !answer.trim()) return;
    setReviewing(true);
    setError(false);
    try {
      const outcome = await reviewExplanation({ stageId, answer });
      if (!outcome.ok) {
        if (outcome.error === "unavailable") setError(true);
        return;
      }
      if (outcome.kind === "follow-up") {
        setQuote(outcome.quote);
        setFollowUp(outcome.question);
      }
    } catch {
      setError(true);
    } finally {
      setReviewing(false);
    }
  }

  async function submitFollowUp() {
    if (reviewing || !followUpAnswer.trim()) return;
    setReviewing(true);
    setError(false);
    try {
      const outcome = await reviewExplanation({ stageId, answer, followUpAnswer });
      if (!outcome.ok) {
        if (outcome.error === "unavailable") setError(true);
        return;
      }
      if (outcome.kind === "pass" || outcome.kind === "needs-improvement") {
        setResult(outcome.kind);
        setFeedback(outcome.feedback);
      }
    } catch {
      setError(true);
    } finally {
      setReviewing(false);
    }
  }

  function tryAgain() {
    setFollowUp("");
    setQuote("");
    setFollowUpAnswer("");
    setResult(undefined);
    setFeedback("");
    setError(false);
  }

  const status = reviewing
    ? "Reviewing your explanation..."
    : result
      ? `${result === "pass" ? "Milestone passed" : "Not quite yet"}. ${feedback}`
      : "";

  return (
    <>
      <p className="sf-review-live" aria-live="polite">{status}</p>
      <ExplainBackGate
        stage={stageLabel}
        concept={question}
        prompt="There is no timer and no score. This is a check-in."
        answer={answer}
        onAnswerChange={setAnswer}
        onSubmitAnswer={error || followUp ? undefined : () => void submitAnswer()}
        hint="A short paragraph, in your own words, is enough."
        followUp={
          followUp ? (
            <>
              <q>{quote}</q> {followUp}
            </>
          ) : undefined
        }
        followUpAnswer={followUpAnswer}
        onFollowUpChange={setFollowUpAnswer}
        onSubmitFollowUp={error || result ? undefined : () => void submitFollowUp()}
        reviewing={reviewing}
        result={result}
        resultFeedback={feedback}
        continueLabel={continueLabel}
        onContinue={() => router.push(continueHref)}
        retryLabel="Try again"
        onRetry={tryAgain}
        voiceEnabled={voiceReady}
        voiceMode={mode}
        onVoiceModeChange={voiceReady ? chooseMode : undefined}
        voicePhase={phase}
        onStartVoice={startRecording}
        onStopVoice={stopRecording}
        voiceNote={voiceNote}
      />
      {error ? (
        <ErrorState
          compact
          role="alert"
          title="We could not review your explanation."
          description="Your answer is saved."
          retryLabel="Try again"
          onRetry={() => setError(false)}
        />
      ) : null}
    </>
  );
}
