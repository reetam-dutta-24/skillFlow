"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ExplainBackGate } from "@/components/learning/ExplainBackGate.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { useMockLoading } from "@/lib/use-mock-loading";
import { getStageById, getSkillForStage, getNextStage } from "@/lib/mock-data";

// Simulates a completed voice capture — no real speech-to-text in this phase.
const VOICE_TRANSCRIPT =
  "So basically it works by tracking the state and re-rendering whenever that state changes, which keeps the UI in sync with the data.";

const PASS_MIN_LENGTH = 40;

// page.tsx already ran notFound() for an unknown id before this renders,
// so existence here is just a type-narrowing guard, not a real branch.
export function MilestoneView({ stageId }: { stageId: string }) {
  const router = useRouter();
  const loading = useMockLoading();
  const stage = getStageById(stageId);
  const skill = getSkillForStage(stageId);

  const [answer, setAnswer] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [result, setResult] = useState<"pass" | "needs-improvement" | undefined>(undefined);

  if (!stage || !skill) return null;

  function reset() {
    setAnswer("");
    setShowFollowUp(false);
    setFollowUpAnswer("");
    setResult(undefined);
  }

  return (
    <AppShell title={`Milestone · ${stage.title}`} active="roadmaps">
      {loading ? (
        <>
          <Skeleton height={16} width={200} />
          <Skeleton height={32} width="70%" />
          <Skeleton height={140} radius="var(--radius-panel)" />
        </>
      ) : (
        <ExplainBackGate
          stage={`Stage ${stage.order} · ${stage.title}`}
          concept={stage.explainBack.concept}
          prompt={stage.explainBack.prompt}
          answer={answer}
          onAnswerChange={setAnswer}
          onSubmitAnswer={() => setShowFollowUp(true)}
          followUp={showFollowUp ? stage.explainBack.followUpQuestion : undefined}
          followUpAnswer={followUpAnswer}
          onFollowUpChange={setFollowUpAnswer}
          onSubmitFollowUp={() =>
            setResult(followUpAnswer.trim().length >= PASS_MIN_LENGTH ? "pass" : "needs-improvement")
          }
          result={result}
          resultFeedback={
            result === "pass"
              ? stage.explainBack.passFeedback
              : result === "needs-improvement"
                ? stage.explainBack.needsImprovementFeedback
                : undefined
          }
          onContinue={() => {
            const next = getNextStage(stage.id);
            router.push(next ? `/lesson/${next.id}` : "/dashboard");
          }}
          onRetry={reset}
          voiceEnabled
          onVoice={() => {
            if (!showFollowUp) setAnswer(VOICE_TRANSCRIPT);
            else setFollowUpAnswer(VOICE_TRANSCRIPT);
          }}
        />
      )}
    </AppShell>
  );
}
