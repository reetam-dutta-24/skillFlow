import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SKILL_CHOICES } from "@/lib/learner";
import { getRoadmapIndex } from "@/lib/data/roadmap";
import { Button } from "@/components/core/Button.jsx";
import { MasteryChip } from "@/components/core/MasteryChip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { AddSkillButton } from "../dashboard/_components/AddSkillButton";

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
        <p>One ordered path per skill. A stage stays locked until the explain-back before it is passed.</p>
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
              const image = SKILL_CHOICES.find((choice) => choice.slug === row.skill.slug)?.image;
              return (
                <li key={row.skill.id}>
                  <article className="sf-roadmap-card">
                    {image ? <Image className="sf-explore-photo" src={image} alt="" width={480} height={270} /> : null}
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
        <ul className="sf-explore">
          {data.availableToAdd.map((skill) => {
            const image = SKILL_CHOICES.find((choice) => choice.slug === skill.slug)?.image;
            const soon = skill.status === "coming_soon";
            return (
              <li key={skill.id}>
                <article className="sf-explore-card">
                  {image ? <Image className="sf-explore-photo" src={image} alt="" width={480} height={270} /> : null}
                  <div>
                    <h3>{skill.name}</h3>
                    {skill.description ? <p>{skill.description}</p> : null}
                  </div>
                  {soon ? (
                    <Button type="button" variant="quiet" size="sm" disabled>
                      Coming soon
                    </Button>
                  ) : (
                    <p className="sf-roadmap-actions">
                      <Link href={`/roadmap/${skill.slug}`}>View path</Link>
                      <AddSkillButton />
                    </p>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
