"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SectionHeader } from "@/components/core/SectionHeader.jsx";
import { ProgressBar } from "@/components/core/ProgressBar.jsx";
import { RoadmapStage } from "@/components/learning/RoadmapStage.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { useMockLoading } from "@/lib/use-mock-loading";
import { getSkillBySlug } from "@/lib/mock-data";

// page.tsx already ran notFound() for an unknown slug before this renders,
// so existence here is just a type-narrowing guard, not a real branch.
export function RoadmapView({ skillSlug }: { skillSlug: string }) {
  const router = useRouter();
  const loading = useMockLoading();
  const skill = getSkillBySlug(skillSlug);
  if (!skill) return null;

  return (
    <AppShell title={skill.name} active="roadmaps">
      {loading ? (
        <>
          <Skeleton height={32} width={320} />
          <Skeleton height={12} width="100%" radius="var(--radius-full)" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} radius="var(--radius-card)" />
          ))}
        </>
      ) : (
        <>
          <SectionHeader title={skill.name} subtitle={skill.description} />
          <ProgressBar value={skill.mastery} max={100} label="Overall mastery" showValue />
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {skill.stages.map((stage, i) => (
              <RoadmapStage
                key={stage.id}
                index={i + 1}
                title={stage.title}
                description={stage.description}
                status={stage.status}
                mastery={stage.mastery}
                meta={stage.meta}
                unlockHint={stage.unlockHint}
                last={i === skill.stages.length - 1}
                onOpen={() => router.push(`/lesson/${stage.id}`)}
              />
            ))}
          </ol>
        </>
      )}
    </AppShell>
  );
}
