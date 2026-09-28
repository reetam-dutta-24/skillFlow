import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { Icon } from "@/components/core/Icon.jsx";
import { StatCard } from "@/components/core/StatCard.jsx";
import { StreakBanner } from "@/components/learning/StreakBanner.jsx";

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getDashboardData();
  const first = session.user.name?.trim().split(/\s+/)[0];

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <h1>Home</h1>
        <p>{first ? `Welcome back, ${first}.` : "Welcome back."}</p>
      </header>
      <StreakBanner
        streak={data.currentStreak}
        nextLabel={data.nextLesson?.title}
        nextSkill={data.nextLesson?.skillName}
        continueHref={data.nextLesson?.href}
        style={{ flexWrap: "wrap" }}
      />
      <section className="sf-dash-stats" aria-labelledby="dash-stats">
        <h2 id="dash-stats">Your progress</h2>
        <ul className="sf-stat-grid">
          <li>
            <StatCard label="Skills in progress" value={data.skillsInProgress} icon={<Icon name="route" size={14} />} />
          </li>
          <li>
            <StatCard
              emphasis
              label="Milestones this week"
              value={data.milestonesPassedThisWeek}
              icon={<Icon name="flag" size={14} />}
            />
          </li>
          <li>
            <StatCard label="Quizzes completed" value={data.quizzesCompleted} icon={<Icon name="list-checks" size={14} />} />
          </li>
          <li>
            <StatCard label="Longest streak" value={data.longestStreak} unit="days" icon={<Icon name="flame" size={14} />} />
          </li>
        </ul>
      </section>
    </div>
  );
}
