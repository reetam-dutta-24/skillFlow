import { SectionHeader } from "../core/SectionHeader.jsx";

/** Public snapshot figures. The values come from the landing mock. */
export function LandingFacts({ title, subtitle, facts }) {
  return (
    <section id="facts" className="sf-section sf-band-raise" aria-labelledby="landing-facts-title">
      <SectionHeader
        align="center"
        className="sf-section-head"
        title={title}
        subtitle={subtitle}
        titleId="landing-facts-title"
        titleSize="var(--text-section)"
        subtitleSize="var(--text-section-sub)"
      />
      <dl className="sf-facts">
        {facts.map((fact) => (
          <div key={fact.label} className="sf-fact">
            <dt>
              <span className="sf-fact-value">{fact.value}</span>
              <span className="sf-fact-label">{fact.label}</span>
            </dt>
            <dd>{fact.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
