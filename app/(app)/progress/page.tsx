import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProgress } from "@/lib/data/progress";
import { Icon } from "@/components/core/Icon.jsx";
import { StatCard } from "@/components/core/StatCard.jsx";
import { ProgressBoard } from "./_components/ProgressBoard";

export const metadata: Metadata = { title: "Progress" };

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const data = await getProgress();

  return (
    <div className="sf-progress">
      <header className="sf-page-head">
        <h1>Progress</h1>
        <p>Mastery comes from verified understanding, not watch time. The current streak is {data.currentStreak} days.</p>
      </header>
      <section className="sf-dash-stats" aria-labelledby="progress-stats">
        <h2 id="progress-stats">This account</h2>
        <ul className="sf-stat-grid">
          <li><StatCard label="Skills in progress" value={data.skillsInProgress} icon={<Icon name="route" size={14} />} /></li>
          <li><StatCard emphasis label="Milestones this week" value={data.milestonesPassedThisWeek} icon={<Icon name="flag" size={14} />} /></li>
          <li><StatCard label="Quizzes completed" value={data.quizzesCompleted} icon={<Icon name="list-checks" size={14} />} /></li>
          <li><StatCard label="Longest streak" value={data.longestStreak} unit="days" icon={<Icon name="flame" size={14} />} /></li>
        </ul>
      </section>
      <ProgressBoard data={data} />
    </div>
  );
}
