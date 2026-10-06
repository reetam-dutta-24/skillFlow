import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProgress } from "@/lib/data/progress";
import { followedRecords } from "@/lib/records/load";
import { Icon } from "@/components/core/Icon.jsx";
import { StatCard } from "@/components/core/StatCard.jsx";
import { ProgressBoard } from "./_components/ProgressBoard";

export const metadata: Metadata = { title: "Progress" };

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const data = await getProgress();
  const records = await followedRecords(userId);

  return (
    <div className="sf-progress">
      <header className="sf-page-head">
        <h1>Progress</h1>
        <p>
          Mastery is the share of stages with a passed explain-back. Passing every stage on a path earns the certificate. The current streak is {data.currentStreak} {data.currentStreak === 1 ? "day" : "days"}.
        </p>
      </header>
      <section className="sf-dash-stats" aria-labelledby="progress-stats">
        <h2 id="progress-stats">This account</h2>
        <ul className="sf-stat-grid">
          <li><StatCard label="Skills in progress" value={data.skillsInProgress} icon={<Icon name="route" size={14} />} /></li>
          <li><StatCard emphasis label="Milestones this week" value={data.milestonesPassedThisWeek} icon={<Icon name="flag" size={14} />} /></li>
          <li><StatCard label="Explain-backs passed" value={data.explainBacksPassed} icon={<Icon name="message-square-quote" size={14} />} /></li>
          <li><StatCard label="Longest streak" value={data.longestStreak} unit={data.longestStreak === 1 ? "day" : "days"} icon={<Icon name="flame" size={14} />} /></li>
          <li><StatCard label="Retention" value={data.retention ?? "—"} unit={data.retention == null ? undefined : "of 100"} hint={data.retention == null ? "Shows after the first recall" : "Average of recall answers"} icon={<Icon name="message-square-quote" size={14} />} /></li>
        </ul>
      </section>
      {records.length > 0 ? (
        <section className="sf-progress-records" aria-labelledby="progress-records">
          <h2 id="progress-records">Records</h2>
          <ul>
            {records.map((record) => (
              <li key={record.slug}>
                <span>{record.name}</span>
                <Link href={`/transcript/${userId}/${record.slug}`}>Transcript</Link>
                {record.complete ? <Link href={`/certificate/${userId}/${record.slug}`}>Certificate</Link> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ProgressBoard data={data} />
    </div>
  );
}
