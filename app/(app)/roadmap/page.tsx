import type { Metadata } from "next";
import { SkillImage } from "@/components/core/SkillImage";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { viewerHasPremium } from "@/lib/billing/access";
import { auth } from "@/lib/auth";
import { FreePlanNotice } from "../_components/FreePlanNotice";
import { getRoadmapIndex } from "@/lib/data/roadmap";
import { MasteryChip } from "@/components/core/MasteryChip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { FollowNicheButton } from "../skills/_components/FollowNicheButton";
import { FollowedNicheFrame } from "../skills/_components/FollowedNicheFrame";
import { NicheGrid, NicheTeaserFallback } from "../skills/_components/NicheGrid";

export const metadata: Metadata = {
  title: "Paths",
};

export default async function RoadmapIndexPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [data, premium] = await Promise.all([getRoadmapIndex(), viewerHasPremium()]);

  return (
    <FollowedNicheFrame>
    <div className="sf-dash">
      <header className="sf-page-head">
        <h1>Paths</h1>
        <p>Thirty paths are free. Pass the explain-back on a stage to open the next one. A Premium niche opens the upgrade page.</p>
      </header>
      {premium ? null : <FreePlanNotice />}
      <section className="sf-dash-block" aria-labelledby="roadmap-yours">
        <h2 id="roadmap-yours">Your paths</h2>
        {data.followed.length === 0 ? (
          <EmptyState
            icon="route"
            title="No skill followed yet"
            description="Follow a skill below to open its path."
            action={
              <a className="sf-roadmap-link" href="#roadmap-more">
                See skills
              </a>
            }
          />
        ) : (
          <ul className="sf-roadmap-list">
            {data.followed.map((row) => {
              const image = row.skill.image;
              return (
                <li key={row.skill.id}>
                  <article className="sf-roadmap-card">
                    {image ? <SkillImage className="sf-explore-photo" src={image} alt="" width={480} height={270} sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 320px" /> : null}
                    <div className="sf-roadmap-copy">
                      <h3>{row.skill.name}</h3>
                      <p>
                        {row.stagePosition}
                        {row.stageTitle ? ` · ${row.stageTitle}` : ""}
                      </p>
                      <MasteryChip percent={row.skill.masteryPercent} />
                      <div className="sf-roadmap-actions">
                        <FollowNicheButton skillId={row.skill.id} followed name={row.skill.name} />
                        <Link href={row.continueHref}>Continue</Link>
                        <Link href={`/roadmap/${row.skill.slug}`}>Open path</Link>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="sf-dash-block" aria-labelledby="roadmap-more">
        <h2 id="roadmap-more">More skills</h2>
        <Suspense fallback={<NicheTeaserFallback />}>
          <NicheGrid mode="teaser" />
        </Suspense>
      </section>
    </div>
    </FollowedNicheFrame>
  );
}
