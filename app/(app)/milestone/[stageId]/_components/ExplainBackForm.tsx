"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ExplainBackGate } from "@/components/learning/ExplainBackGate.jsx";

const MOCK_TRANSCRIPT =
  "The dependency array is the list of values the effect reads. React can skip the effect when those values have not changed.";

const TRANSCRIBE_MS = 2000;

export function ExplainBackForm({ stageLabel, question }: { stageLabel: string; question: string }) {
  const [answer, setAnswer] = useState("");
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [phase, setPhase] = useState<"idle" | "recording" | "transcribing">("idle");
  const [voiceNote, setVoiceNote] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  function chooseMode(next: "text" | "voice") {
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

  return (
    <ExplainBackGate
      stage={stageLabel}
      concept={question}
      prompt="There is no timer and no score. This is a check-in."
      answer={answer}
      onAnswerChange={setAnswer}
      hint="A short paragraph, in your own words, is enough."
      voiceEnabled={voiceReady}
      voiceMode={mode}
      onVoiceModeChange={voiceReady ? chooseMode : undefined}
      voicePhase={phase}
      onStartVoice={startRecording}
      onStopVoice={stopRecording}
      voiceNote={voiceNote}
    />
  );
}
