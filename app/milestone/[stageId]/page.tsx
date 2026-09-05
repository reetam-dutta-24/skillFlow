"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ExplainBackGate } from "@/components/learning/ExplainBackGate.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { Button } from "@/components/core/Button.jsx";
import { useMockLoading } from "@/lib/use-mock-loading";
import { getStageById, getSkillForStage, getNextStage } from "@/lib/mock-data";

// Simulates a completed voice capture — no real speech-to-text in this phase.
const VOICE_TRANSCRIPT =
  "So basically it works by tracking the state and re-rendering whenever that state changes, which keeps the UI in sync with the data.";

const PASS_MIN_LENGTH = 40;

export default function MilestonePage() {
  const router = useRouter();
  const params = useParams<{ stageId: string }>();
  const loading = useMockLoading();
  const stage = getStageById(params.stageId);
  const skill = getSkillForStage(params.stageId);

  const [answer, setAnswer] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [result, setResult] = useState<"pass" | "needs-improvement" | undefined>(undefined);

  function reset() {
    setAnswer("");
    setShowFollowUp(false);
    setFollowUpAnswer("");
    setResult(undefined);
  }

  return (
    <AppShell title={stage ? `Milestone · ${stage.title}` : "Milestone"} active="roadmaps">
      {loading ? (
        <>
          <Skeleton height={16} width={200} />
          <Skeleton height={32} width="70%" />
          <Skeleton height={140} radius="var(--radius-panel)" />
        </>
      ) : !stage || !skill ? (
        <EmptyState
          icon="message-square-quote"
          title="Milestone not found"
          description="This explain-back check doesn't exist yet."
          action={<Button variant="outline" onClick={() => router.push("/dashboard")}>Back to dashboard</Button>}
        />
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
