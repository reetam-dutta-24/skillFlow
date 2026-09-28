import Image from "next/image";
import Link from "next/link";
import { goalById, goalLine, paceById, stageTag } from "@/lib/learner";
import { Chip } from "../core/Chip.jsx";
import { Icon } from "../core/Icon.jsx";
import { EmptyState } from "../feedback/EmptyState.jsx";

/** Home feed. One skill, chosen during onboarding. Pace decides how much of that path opens first. */
export function ForYou({ name, skill, pace, goal, stages }) {
  const paceChoice = paceById(pace);
  const goalChoice = goalById(goal);

  return (
    <section className="sf-reco-wrap" aria-labelledby="reco-title">
      {name ? <p className="sf-dash-name">{name}</p> : null}
      <h1 id="reco-title">Your path</h1>
      <article className="sf-reco">
        <div className="sf-reco-media">
          <Image src={skill.image} alt="" fill sizes="(min-width: 800px) 760px, 100vw" priority />
        </div>
        <div className="sf-reco-copy">
          <p>Recommended for you</p>
          <h2>{skill.title}</h2>
          <p>{goalLine(goal)}</p>
          <div className="sf-reco-chips">
            <Chip tone="accent" icon={<Icon name={paceChoice.icon} size={12} />}>
              {paceChoice.label}
            </Chip>
            <Chip icon={<Icon name={goalChoice.icon} size={12} />}>{goalChoice.label}</Chip>
          </div>
        </div>
      </article>
      {stages.length ? (
        <ol className="sf-reco-stages">
          {stages.map((stage, index) => (
            <li key={stage.id}>
              <Link href={`/dashboard/path/${stage.order}`}>
                <span>{String(stage.order).padStart(2, "0")}</span>
                <span>
                  <span className="sf-reco-tag">{stageTag(pace, index)}</span>
                  <span className="sf-reco-stage-title">{stage.title}</span>
                  {stage.description ? <span className="sf-reco-stage-desc">{stage.description}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          icon="route"
          title="Lessons are not ready yet."
          description="Your preference is saved. This skill will show up here when its roadmap is ready."
        />
      )}
      <p className="sf-dash-edit">
        <Link href="/dashboard/path">Full path</Link>
        <Link href="/onboarding?edit=1">Update preferences</Link>
      </p>
    </section>
  );
}
