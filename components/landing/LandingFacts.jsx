import { SectionHeader } from "../core/SectionHeader.jsx";

/** Product facts. The figures describe the system, and they come from the landing mock. */
export function LandingFacts({ title, subtitle, facts }) {
  return (
    <section id="facts" className="sf-section" aria-labelledby="landing-facts-title">
      <SectionHeader title={title} subtitle={subtitle} titleId="landing-facts-title" />
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
