import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAnalytics } from "@/lib/data/analytics";
import { AnalyticsBoard } from "./_components/AnalyticsBoard";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const data = await getAnalytics();

  return (
    <div className="sf-analytics">
      <header className="sf-page-head">
        <h1>Analytics</h1>
        <p>What your check-ins, quizzes, and explain-backs say about the last few months. This is verified understanding, not time watched.</p>
      </header>
      <ul className="sf-insight-row">
        {data.insights.map((insight) => (
          <li key={insight.title}>
            <h2>{insight.title}</h2>
            <p>{insight.body}</p>
          </li>
        ))}
      </ul>
      <p className="sf-analytics-note">
        Current streak {data.streak} days. Longest streak {data.longest} days.
        {data.reviewHref ? (
          <>
            {" "}
            <Link href={data.reviewHref}>Review the weakest topic</Link>
          </>
        ) : null}
      </p>
      <AnalyticsBoard data={data} />
    </div>
  );
}
