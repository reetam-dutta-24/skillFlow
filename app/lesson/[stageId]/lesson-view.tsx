"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { LessonPlayer } from "@/components/learning/LessonPlayer.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { useMockLoading } from "@/lib/use-mock-loading";
import { getStageById, getSkillForStage } from "@/lib/mock-data";

// page.tsx already ran notFound() for an unknown id before this renders,
// so existence here is just a type-narrowing guard, not a real branch.
export function LessonView({ stageId }: { stageId: string }) {
  const router = useRouter();
  const loading = useMockLoading();
  const stage = getStageById(stageId);
  const skill = getSkillForStage(stageId);
  const [watched, setWatched] = useState(stage?.status === "done");
  if (!stage || !skill) return null;

  return (
    <AppShell title={stage.lesson.title} active="roadmaps">
      {loading ? (
        <>
          <Skeleton height={20} width={280} />
          <Skeleton height={340} radius="var(--radius-card)" />
        </>
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
