import React from "react";
import { StatCard } from "../core/StatCard.jsx";
import { Icon } from "../core/Icon.jsx";
import { Skeleton } from "../feedback/Skeleton.jsx";
import { stats } from "@/lib/mock-data";

// The 4 mastery-metric tiles shown identically on the dashboard and the
// progress page.
export function StatsGrid({ loading = false }: { loading?: boolean }) {
  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={90} radius="var(--radius-card)" />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      <StatCard
        label="Current streak"
        value={stats.currentStreak}
        unit={stats.currentStreak === 1 ? "day" : "days"}
        icon={<Icon name="flame" size={18} color="var(--accent)" />}
        emphasis
      />
      <StatCard
        label="Skills in progress"
        value={stats.skillsInProgress}
        icon={<Icon name="route" size={18} color="var(--text-secondary)" />}
      />
      <StatCard
        label="Milestones passed"
        value={stats.milestonesPassed}
        icon={<Icon name="circle-check" size={18} color="var(--text-secondary)" />}
      />
      <StatCard
        label="Quizzes completed"
        value={stats.quizzesCompleted}
        icon={<Icon name="clipboard-check" size={18} color="var(--text-secondary)" />}
      />
    </div>
  );
}
