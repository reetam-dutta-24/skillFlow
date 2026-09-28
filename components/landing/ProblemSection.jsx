import { GlassCard } from "../core/GlassCard.jsx";
import { Icon } from "../core/Icon.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";

/** Why a tutorial feed is a poor place to learn a skill. */
export function ProblemSection({ title, body, points }) {
  return (
    <section id="problem" className="sf-section sf-problem sf-band-base" aria-labelledby="landing-problem-title">
      <SectionHeader
        align="center"
        className="sf-section-head"
        title={title}
        titleId="landing-problem-title"
        titleSize="var(--text-section)"
      />
      <p className="sf-problem-body">{body}</p>
      <ul className="sf-problem-points">
        {points.map((point) => (
          <li key={point.title}>
            <GlassCard style={{ height: "100%", padding: "var(--space-8)" }}>
              <span className="sf-problem-icon">
                <Icon name={point.icon} size={20} />
              </span>
              <h3>
                {point.title}
                <span className="sf-problem-rest">{`: ${point.body}`}</span>
              </h3>
            </GlassCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
