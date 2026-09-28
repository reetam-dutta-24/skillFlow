import { Chip } from "../core/Chip.jsx";
import { GlassCard } from "../core/GlassCard.jsx";
import { Icon } from "../core/Icon.jsx";
import { CtaLink } from "./CtaLink.jsx";

/** Hero. Copy is the specified product statement. The roadmap beside it is an illustration, not an account. */
export function LandingHero({ content }) {
  return (
    <section id="home" className="sf-hero sf-band-base" aria-labelledby="landing-hero-title">
      <div className="sf-hero-grid">
        <div className="sf-hero-copy">
          <p className="sf-eyebrow">{content.eyebrow}</p>
          <h1 id="landing-hero-title" className="sf-display">
            {content.headline}
          </h1>
          <p className="sf-lead">{content.lead}</p>
          <p className="sf-skills-note">{content.skillsNote}</p>
          <div className="sf-cta-row">
            <CtaLink href={content.startCta.href}>{content.startCta.label}</CtaLink>
            <CtaLink href={content.heroSecondary.href} variant="outline">
              {content.heroSecondary.label}
            </CtaLink>
          </div>
          <p className="sf-microcopy">{content.heroNote}</p>
        </div>
        <figure className="sf-roadmap" aria-labelledby="roadmap-preview-title">
          <GlassCard style={{ padding: "var(--space-8)" }}>
            <p className="sf-roadmap-kicker">{content.preview.caption}</p>
            <p id="roadmap-preview-title" className="sf-roadmap-skill">
              {content.preview.skill}
            </p>
            <ol className="sf-roadmap-stages">
              {content.preview.stages.map((stage) => (
                <li key={stage.index} className={stage.locked ? "sf-stage is-locked" : "sf-stage is-active"}>
                  <span className="sf-stage-index">{stage.index}</span>
                  <span className="sf-stage-title">{stage.title}</span>
                  <Chip tone={stage.locked ? "lock" : "accent"} icon={<Icon name={stage.locked ? "lock" : "circle"} size={12} />}>
                    {stage.status}
                  </Chip>
                </li>
              ))}
            </ol>
          </GlassCard>
        </figure>
      </div>
    </section>
  );
}
