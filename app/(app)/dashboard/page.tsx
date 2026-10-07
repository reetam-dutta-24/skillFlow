import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { viewerHasPremium } from "@/lib/billing/access";
import { auth } from "@/lib/auth";
import { FreePlanNotice } from "../_components/FreePlanNotice";
import { getDashboardData } from "@/lib/data/dashboard";
import type { LessonLaneStatus } from "@/lib/types/pages";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { LessonCard } from "@/components/learning/LessonCard.jsx";
import { SkillRow } from "@/components/learning/SkillRow.jsx";
import { StreakBanner } from "@/components/learning/StreakBanner.jsx";
import { CareerTestCard } from "@/components/dashboard/CareerTestCard";
import { HomeKpis, HomePanels } from "@/components/dashboard/HomeSections";
import { loadHomeExtras } from "@/lib/data/home";
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
  const extras = await loadHomeExtras(
    session.user.id,
    data.followed.map((row) => ({ id: row.skill.id, slug: row.skill.slug })),
  );
  const first = session.user.name?.trim().split(/\s+/)[0];
  // A new learner sees what to do next, not a wall of zeros.
  const started = data.followed.length > 0 || data.explainBacksPassed > 0 || data.longestStreak > 0;

  return (
    <FollowedNicheFrame>
    <div className="sf-dash">
      <header className="sf-page-head">
        <h1>Home</h1>
        <p>{first ? `Welcome back, ${first}.` : "Welcome back."}</p>
      </header>
      <CareerTestCard userId={session.user.id} />
      {data.currentStreak > 0 || data.nextLesson ? (
        <StreakBanner
          streak={data.currentStreak}
          nextLabel={data.nextLesson?.title}
          nextSkill={data.nextLesson?.skillName}
          continueHref={data.nextLesson?.href}
          style={{ flexWrap: "wrap" }}
        />
      ) : null}
      {started ? <HomeKpis data={data} extras={extras} /> : null}
      <section className="sf-dash-block" aria-labelledby="dash-skills">
        <h2 id="dash-skills">Your paths</h2>
        {data.followed.length === 0 ? (
          <EmptyState
            icon="route"
            title="Pick your first path"
            description="Thirty paths are free, every stage included. Follow one and its stages show up here."
            action={
              <Link className="sf-btn sf-btn--gradient sf-btn--md" href="/skills">
                Browse niches
              </Link>
            }
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
                  thumbnail={item.image ?? undefined}
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
      <HomePanels data={data} extras={extras} userId={session.user.id} />
      <section className="sf-dash-block" aria-labelledby="dash-explore">
        <h2 id="dash-explore">Explore</h2>
        <Suspense fallback={<NicheTeaserFallback />}>
          <NicheGrid mode="teaser" />
        </Suspense>
      </section>
      {premium ? null : <FreePlanNotice compact />}
    </div>
    </FollowedNicheFrame>
  );
}
