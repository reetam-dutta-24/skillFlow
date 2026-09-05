"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ChartPanel } from "@/components/data/ChartPanel.jsx";
import { DonutChart } from "@/components/data/DonutChart.jsx";
import { LineChart } from "@/components/data/LineChart.jsx";
import { WeakTopicList } from "@/components/data/WeakTopicList.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { useMockLoading } from "@/lib/use-mock-loading";
import { skills, masteryGrowth, weakTopics } from "@/lib/mock-data";

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export default function ProgressPage() {
  const router = useRouter();
  const loading = useMockLoading();

  return (
    <AppShell title="Progress" active="progress">
      {loading ? (
        <>
          <StatsGrid loading />
          <Skeleton height={220} radius="var(--radius-card)" />
          <Skeleton height={220} radius="var(--radius-card)" />
          <Skeleton height={180} radius="var(--radius-card)" />
        </>
      ) : (
        <>
          <StatsGrid />
          <ChartPanel title="Mastery by skill" subtitle="Overall progress across each niche">
            <DonutChart slices={skills.map((s) => ({ label: s.name, value: s.mastery }))} />
          </ChartPanel>
          <ChartPanel title="Mastery growth" subtitle="Weekly mastery gain per skill">
            <LineChart
              data={masteryGrowth}
              series={skills.map((s, i) => ({ key: s.slug, label: s.name, color: CHART_COLORS[i % CHART_COLORS.length] }))}
            />
          </ChartPanel>
          <ChartPanel title="Weak topics" subtitle="Concepts flagged from recent quizzes and checks">
            {weakTopics.length === 0 ? (
              <EmptyState compact icon="sparkles" title="No weak topics" description="Nice work — nothing flagged right now." />
            ) : (
              <WeakTopicList
                topics={weakTopics}
                onReview={(t) => {
                  const full = weakTopics.find((w) => w.id === t.id);
                  if (full) router.push(`/lesson/${full.stageId}`);
                }}
              />
            )}
          </ChartPanel>
        </>
      )}
    </AppShell>
  );
}
