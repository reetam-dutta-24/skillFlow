"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SectionHeader } from "@/components/core/SectionHeader.jsx";
import { ProgressBar } from "@/components/core/ProgressBar.jsx";
import { RoadmapStage } from "@/components/learning/RoadmapStage.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { Button } from "@/components/core/Button.jsx";
import { useMockLoading } from "@/lib/use-mock-loading";
import { getSkillBySlug } from "@/lib/mock-data";

export default function RoadmapPage() {
  const router = useRouter();
  const params = useParams<{ skillSlug: string }>();
  const loading = useMockLoading();
  const skill = getSkillBySlug(params.skillSlug);

  return (
    <AppShell title={skill ? skill.name : "Roadmap"} active="roadmaps">
      {loading ? (
        <>
          <Skeleton height={32} width={320} />
          <Skeleton height={12} width="100%" radius="var(--radius-full)" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} radius="var(--radius-card)" />
          ))}
        </>
      ) : !skill ? (
        <EmptyState
          icon="compass"
          title="Skill not found"
          description="This roadmap doesn't exist yet."
          action={<Button variant="outline" onClick={() => router.push("/dashboard")}>Back to dashboard</Button>}
        />
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
