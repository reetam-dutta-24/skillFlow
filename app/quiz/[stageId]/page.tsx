"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { QuizQuestion } from "@/components/learning/QuizQuestion.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { Button } from "@/components/core/Button.jsx";
import { useMockLoading } from "@/lib/use-mock-loading";
import { getStageById, getSkillForStage } from "@/lib/mock-data";

export default function QuizPage() {
  const router = useRouter();
  const params = useParams<{ stageId: string }>();
  const loading = useMockLoading();
  const stage = getStageById(params.stageId);
  const skill = getSkillForStage(params.stageId);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const questions = stage?.quiz ?? [];
  const question = questions[index];

  function handleNext() {
    if (!stage) return;
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      router.push(`/milestone/${stage.id}`);
    }
  }

  return (
    <AppShell title={stage ? `Quiz · ${stage.title}` : "Quiz"} active="roadmaps">
      {loading ? (
        <>
          <Skeleton height={16} width={160} />
          <Skeleton height={28} width="80%" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={52} radius="var(--radius-panel)" />
          ))}
        </>
      ) : !stage || !skill ? (
        <EmptyState
          icon="help-circle"
          title="Quiz not found"
          description="This quiz doesn't exist yet."
          action={<Button variant="outline" onClick={() => router.push("/dashboard")}>Back to dashboard</Button>}
        />
      ) : questions.length === 0 ? (
        <EmptyState
          icon="help-circle"
          title="No quiz yet for this stage"
          description="Come back once questions have been added."
          action={<Button variant="outline" onClick={() => router.push(`/lesson/${stage.id}`)}>Back to lesson</Button>}
        />
      ) : (
        <QuizQuestion
          index={index + 1}
          total={questions.length}
          question={question.prompt}
          options={question.options}
          correctIndex={question.correctIndex}
          selected={selected}
          onSelect={setSelected}
          explanation={question.explanation}
          onNext={handleNext}
        />
      )}
    </AppShell>
  );
}
