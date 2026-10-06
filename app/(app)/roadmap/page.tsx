import type { Metadata } from "next";
import { SkillImage } from "@/components/core/SkillImage";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoadmapIndex } from "@/lib/data/roadmap";
import { MasteryChip } from "@/components/core/MasteryChip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { NicheGrid, NicheTeaserFallback } from "../skills/_components/NicheGrid";

export const metadata: Metadata = {
  title: "Roadmaps",
};

export default async function RoadmapIndexPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getRoadmapIndex();

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <h1>Roadmaps</h1>
        <p>Thirty paths are free. The next stage opens after the explain-back, and the last few stages stay locked.</p>
      </header>
      <section className="sf-dash-block" aria-labelledby="roadmap-yours">
        <h2 id="roadmap-yours">Your paths</h2>
        {data.followed.length === 0 ? (
          <EmptyState
            icon="route"
            title="No skill followed yet"
            description="Add a skill to open its path."
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
                      <p className="sf-roadmap-actions">
                        <Link href={row.continueHref}>Continue</Link>
                        <Link href={`/roadmap/${row.skill.slug}`}>Open path</Link>
                      </p>
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
  );
}
