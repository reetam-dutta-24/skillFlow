import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { viewerHasPremium } from "@/lib/billing/access";
import { auth } from "@/lib/auth";
import { FreePlanNotice } from "../_components/FreePlanNotice";
import { getDashboardData } from "@/lib/data/dashboard";
import type { LessonLaneStatus } from "@/lib/types/pages";
import { Icon } from "@/components/core/Icon.jsx";
import { StatCard } from "@/components/core/StatCard.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { LessonCard } from "@/components/learning/LessonCard.jsx";
import { SkillRow } from "@/components/learning/SkillRow.jsx";
import { StreakBanner } from "@/components/learning/StreakBanner.jsx";
import { FollowedNicheFrame } from "../skills/_components/FollowedNicheFrame";
import { NicheGrid, NicheTeaserFallback } from "../skills/_components/NicheGrid";

function cardStatus(status: LessonLaneStatus) {
  if (status === "done") return "done" as const;
  if (status === "current") return "active" as const;
  if (status === "ready") return "todo" as const;
  return "locked" as const;
}

function cardKind(status: LessonLaneStatus) {
  if (status === "milestone_check") return "gate" as const;
  return "lesson" as const;
}

function cardMeta(status: LessonLaneStatus) {
  if (status === "milestone_check") return "Explain-back";
  if (status === "locked") return "Locked";
  return undefined;
}

function canOpen(status: LessonLaneStatus) {
  return status === "done" || status === "current" || status === "ready";
}

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [data, premium] = await Promise.all([getDashboardData(), viewerHasPremium()]);
  const first = session.user.name?.trim().split(/\s+/)[0];

  return (
    <FollowedNicheFrame>
    <div className="sf-dash">
      <header className="sf-page-head">
        <h1>Home</h1>
        <p>{first ? `Welcome back, ${first}.` : "Welcome back."}</p>
      </header>
      {premium ? null : <FreePlanNotice />}
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
            <StatCard label="Explain-backs passed" value={data.explainBacksPassed} icon={<Icon name="message-square-quote" size={14} />} />
          </li>
          <li>
            <StatCard label="Longest streak" value={data.longestStreak} unit={data.longestStreak === 1 ? "day" : "days"} icon={<Icon name="flame" size={14} />} />
          </li>
        </ul>
      </section>
      <section className="sf-dash-block" aria-labelledby="dash-skills">
        <h2 id="dash-skills">Your skills</h2>
        {data.followed.length === 0 ? (
          <EmptyState
            icon="route"
            title="No skill followed yet"
            description="Follow a skill below to open its path."
          />
        ) : (
          data.followed.map((row) => (
          <SkillRow
            key={row.skill.id}
            title={row.skill.name}
            subtitle={row.stagePosition}
            mastery={row.skill.masteryPercent}
            skillId={row.skill.id}
            roadmapHref={row.roadmapHref}
            scrollable={row.lane.length > 0}
          >
            {row.lane.length ? (
              row.lane.map((item) => (
                <LessonCard
                  key={item.id}
                  title={item.title}
                  status={cardStatus(item.status)}
                  kind={cardKind(item.status)}
                  mastery={item.mastery}
                  meta={cardMeta(item.status)}
                  href={canOpen(item.status) ? item.href : undefined}
                />
              ))
            ) : (
              <EmptyState
                compact
                icon="route"
                title="This path is not ready yet"
                description="Your place is saved. Stages will show up here when the roadmap is ready."
                style={{ width: "100%" }}
              />
            )}
          </SkillRow>
          ))
        )}
      </section>
      <section className="sf-dash-block" aria-labelledby="dash-explore">
        <h2 id="dash-explore">Explore</h2>
        <Suspense fallback={<NicheTeaserFallback />}>
          <NicheGrid mode="teaser" />
        </Suspense>
      </section>
    </div>
    </FollowedNicheFrame>
  );
}
