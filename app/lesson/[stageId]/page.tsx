"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { LessonPlayer } from "@/components/learning/LessonPlayer.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { Button } from "@/components/core/Button.jsx";
import { useMockLoading } from "@/lib/use-mock-loading";
import { getStageById, getSkillForStage } from "@/lib/mock-data";

export default function LessonPage() {
  const router = useRouter();
  const params = useParams<{ stageId: string }>();
  const loading = useMockLoading();
  const stage = getStageById(params.stageId);
  const skill = getSkillForStage(params.stageId);
  const [watched, setWatched] = useState(stage?.status === "done");

  return (
    <AppShell title={stage ? stage.lesson.title : "Lesson"} active="roadmaps">
      {loading ? (
        <>
          <Skeleton height={20} width={280} />
          <Skeleton height={340} radius="var(--radius-card)" />
        </>
      ) : !stage || !skill ? (
        <EmptyState
          icon="video-off"
          title="Lesson not found"
          description="This lesson doesn't exist yet."
          action={<Button variant="outline" onClick={() => router.push("/dashboard")}>Back to dashboard</Button>}
        />
      ) : (
        <LessonPlayer
          title={stage.lesson.title}
          skill={skill.name}
          stage={`Stage ${stage.order} · ${stage.title}`}
          duration={stage.lesson.duration}
          watched={watched}
          resource={stage.resource}
          onToggleWatched={() => setWatched((w) => !w)}
          onContinue={() => router.push(`/quiz/${stage.id}`)}
        />
      )}
    </AppShell>
  );
}
