import { Icon } from "../core/Icon.jsx";

const NUMBER = new Intl.NumberFormat("en");

/**
 * Live product totals: learners, niches, stages, resources, ideas explained, and features.
 * @param {{ caption: string, stats: { learners: number, niches: number, stages: number, resources: number, ideas: number, features: number } }} props
 */
export function LandingFacts({ caption, stats }) {
  const facts = [
    { id: "learners", icon: "users", value: stats.learners, label: "Learners", hint: "Accounts created so far", live: true },
    { id: "niches", icon: "library", value: stats.niches, label: "Niches", hint: "Subjects you can follow" },
    { id: "stages", icon: "route", value: stats.stages, label: "Stages", hint: "Ordered steps across every path" },
    { id: "resources", icon: "book-open", value: stats.resources, label: "Resources", hint: "Videos, docs, and courses in the catalog" },
    { id: "ideas", icon: "message-square-quote", value: stats.ideas, label: "Ideas explained", hint: "Passed explain-back answers, kept as notes" },
    { id: "features", icon: "sparkles", value: stats.features, label: "Features", hint: "Tools in every account" },
  ];

  return (
    <section className="sf-section sf-facts-band sf-band-raise" aria-labelledby="landing-facts-title">
      <h2 id="landing-facts-title" className="sf-sr">
        SkillFlow in numbers
      </h2>
      <dl className="sf-facts sf-facts--live">
        {facts.map((fact) => (
          <div key={fact.id} className="sf-fact">
            <span className="sf-fact-icon" aria-hidden="true">
              <Icon name={fact.icon} size={18} />
            </span>
            <dt className="sf-fact-label">
              {fact.label}
              {fact.live ? (
                <span className="sf-fact-live">
                  <span aria-hidden="true" />
                  Live
                </span>
              ) : null}
            </dt>
            <dd className="sf-fact-value">{NUMBER.format(fact.value)}</dd>
            <dd className="sf-fact-hint">{fact.hint}</dd>
          </div>
        ))}
      </dl>
      <p className="sf-facts-caption">{caption}</p>
    </section>
  );
}
