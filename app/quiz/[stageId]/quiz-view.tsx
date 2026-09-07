"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { QuizQuestion } from "@/components/learning/QuizQuestion.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { Button } from "@/components/core/Button.jsx";
import { useMockLoading } from "@/lib/use-mock-loading";
import { getStageById, getSkillForStage } from "@/lib/mock-data";

// page.tsx already ran notFound() for an unknown id before this renders.
// A stage that exists but has zero quiz questions isn't a missing resource
// though — that's just empty content, so it stays a normal 200 EmptyState.
export function QuizView({ stageId }: { stageId: string }) {
  const router = useRouter();
  const loading = useMockLoading();
  const stage = getStageById(stageId);
  const skill = getSkillForStage(stageId);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  if (!stage || !skill) return null;

  const questions = stage.quiz;
  const question = questions[index];
  const resolvedStageId = stage.id; // captured outside the closure below so narrowing holds

  function handleNext() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      router.push(`/milestone/${resolvedStageId}`);
    }
  }

  return (
    <AppShell title={`Quiz · ${stage.title}`} active="roadmaps">
      {loading ? (
        <>
          <Skeleton height={16} width={160} />
          <Skeleton height={28} width="80%" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={52} radius="var(--radius-panel)" />
          ))}
        </>
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
