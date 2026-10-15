import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/core/Icon.jsx";
import { StatCard } from "@/components/core/StatCard.jsx";
import { auth } from "@/lib/auth";
import type { ActivityKind } from "@/lib/activity";
import { getAnalytics } from "@/lib/data/analytics";
import { loadDetoxOverview } from "@/lib/data/detox";
import { DetoxScoreBoard } from "../detox/_components/DetoxBoard";
import { AnalyticsBoard } from "./_components/AnalyticsBoard";

export const metadata: Metadata = { title: "Analytics" };

const KIND_ICON: Record<ActivityKind, string> = {
  stages: "flag",
  ideas: "message-square-quote",
  practice: "pencil",
  recalls: "brain",
  contributions: "git-pull-request",
  questions: "message-circle-question",
  resources: "link",
  videos: "clapperboard",
  events: "calendar",
};

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const [data, detox] = await Promise.all([getAnalytics(), loadDetoxOverview(session.user.id)]);

  return (
    <div className="sf-analytics">
      <header className="sf-page-head">
        <h1>Analytics</h1>
        <p>Everything you did on SkillFlow, in charts. Mastery is the share of a path&apos;s stages with a passed explain-back.</p>
      </header>

      <ul className="sf-analytics-kpis" aria-label="Totals">
        <li>
          <StatCard label="Contributions this year" value={data.totals.contributions} icon={<Icon name="activity" size={14} />} />
        </li>
        <li>
          <StatCard label="Active days" value={data.totals.activeDays} icon={<Icon name="calendar-check" size={14} />} />
        </li>
        <li>
          <StatCard label="Ideas explained" value={data.totals.ideas} icon={<Icon name="message-square-quote" size={14} />} />
        </li>
        <li>
          <StatCard label="Stages passed" value={data.totals.stagesPassed} icon={<Icon name="flag" size={14} />} />
        </li>
        <li>
          <StatCard label="Longest streak" value={data.longest} unit={data.longest === 1 ? "day" : "days"} icon={<Icon name="flame" size={14} />} />
        </li>
        <li>
          <StatCard
            label="Retention"
            value={data.totals.retention ?? "—"}
            unit={data.totals.retention == null ? undefined : "of 100"}
            hint={data.totals.retention == null ? "Shows after your first recall" : undefined}
            icon={<Icon name="brain" size={14} />}
          />
        </li>
      </ul>

      <ul className="sf-insight-row sf-insight-row--four">
        {data.insights.map((insight) => (
          <li key={insight.title}>
            <h2>{insight.title}</h2>
            <p>{insight.body}</p>
          </li>
        ))}
      </ul>

      {data.totals.weakTopics > 0 && data.reviewHref ? (
        <p className="sf-analytics-note">
          {data.totals.weakTopics} {data.totals.weakTopics === 1 ? "topic needs" : "topics need"} another look.{" "}
          <Link href="/dashboard#home-weak">See them on Home</Link> or <Link href={data.reviewHref}>start with the weakest</Link>.
        </p>
      ) : null}

      <AnalyticsBoard data={data} />

      <section className="sf-analytics-detox" aria-labelledby="analytics-detox">
        <header>
          <h2 id="analytics-detox">
            <Icon name="leaf" size={18} /> Dopamine Detox
          </h2>
          {detox.ready ? (
            <p>
              Your Detox Score is {detox.ready.score > 0 ? `+${detox.ready.score}` : detox.ready.score} ({detox.ready.band.label}). {detox.ready.breakdown.summary.replace(/\.$/, "")}.{" "}
              <Link href="/detox">Open Detox</Link>
            </p>
          ) : (
            <p>
              A three-minute self-check gives you a Detox Score that only real learning moves. <Link href="/detox">Start it on the Detox page</Link>
            </p>
          )}
        </header>
        {detox.ready ? <DetoxScoreBoard weeks={detox.ready.weeks} baseline={detox.ready.baseline} score={detox.ready.score} /> : null}
      </section>

      <section className="sf-timeline" aria-labelledby="analytics-timeline">
        <header>
          <h2 id="analytics-timeline">Recent activity</h2>
          <p>Your latest actions across every part of SkillFlow, newest first.</p>
        </header>
        {data.timeline.length ? (
          <ol className="sf-timeline-list">
            {data.timeline.map((item) => (
              <li key={item.id} data-kind={item.kind}>
                <span className="sf-timeline-icon" aria-hidden="true">
                  <Icon name={KIND_ICON[item.kind]} size={15} />
                </span>
                <div>
                  {item.href ? <Link href={item.href}>{item.title}</Link> : <span className="sf-timeline-title">{item.title}</span>}
                  <span className="sf-timeline-meta">
                    {item.detail} · <time dateTime={item.at}>{when(item.at)}</time>
                  </span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="sf-analytics-note">Nothing yet. Pass a stage, save a note, or contribute, and it shows up here.</p>
        )}
      </section>
    </div>
  );
}
