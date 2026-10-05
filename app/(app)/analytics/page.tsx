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
        <p>
          Mastery is the share of open stages with a passed explain-back. A streak day is a UTC day with a saved explain-back or a saved note.
        </p>
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
        Current streak {data.streak} {data.streak === 1 ? "day" : "days"}. Longest streak {data.longest} {data.longest === 1 ? "day" : "days"}.
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
