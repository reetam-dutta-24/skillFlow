"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { StreakBanner } from "@/components/learning/StreakBanner.jsx";
import { SkillRow } from "@/components/learning/SkillRow.jsx";
import { LessonCard } from "@/components/learning/LessonCard.jsx";
import { SkeletonCard } from "@/components/feedback/Skeleton.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { Button } from "@/components/core/Button.jsx";
import { useMockLoading } from "@/lib/use-mock-loading";
import { skills, stats, getActiveStage } from "@/lib/mock-data";

export default function DashboardPage() {
  const router = useRouter();
  const loading = useMockLoading();
  const active = getActiveStage();

  return (
    <AppShell title="Dashboard" active="home">
      {loading ? (
        <>
          <Skeleton height={92} radius="var(--radius-card)" />
          <StatsGrid loading />
          {skills.map((s) => (
            <div key={s.slug} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Skeleton height={20} width={220} />
              <div style={{ display: "flex", gap: 16 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          ))}
        </>
      ) : skills.length === 0 ? (
        <EmptyState
          icon="compass"
          title="No skills yet"
          description="Pick a skill to start building your first roadmap."
          action={<Button variant="gradient" onClick={() => router.push("/settings")}>Add a skill</Button>}
        />
      ) : (
        <>
          <StreakBanner
            streak={stats.currentStreak}
            nextLabel={active?.stage.title}
            nextSkill={active?.skill.name}
            onContinue={active ? () => router.push(`/lesson/${active.stage.id}`) : undefined}
          />
          <StatsGrid />
          {skills.map((skill) => (
            <SkillRow
              key={skill.slug}
              title={skill.name}
              subtitle={`${skill.mastery}% mastery`}
              mastery={skill.mastery}
              onOpenRoadmap={() => router.push(`/roadmap/${skill.slug}`)}
            >
              {skill.stages.map((stage) => (
                <LessonCard
                  key={stage.id}
                  title={stage.title}
                  skill={skill.name}
                  meta={stage.meta}
                  status={stage.status}
                  mastery={stage.mastery}
                  onOpen={stage.status === "locked" ? undefined : () => router.push(`/lesson/${stage.id}`)}
                />
              ))}
            </SkillRow>
          ))}
        </>
      )}
    </AppShell>
  );
}
