/** Slim strip of how the product is built. These are design facts, not usage counts. */
export function LandingFacts({ caption, facts }) {
  return (
    <section className="sf-section sf-facts-band sf-band-raise" aria-labelledby="landing-facts-caption">
      <dl className="sf-facts">
        {facts.map((fact) => (
          <div key={fact.label} className="sf-fact">
            <dt className="sf-fact-value">{fact.value}</dt>
            <dd className="sf-fact-label">{fact.label}</dd>
          </div>
        ))}
      </dl>
      <p id="landing-facts-caption" className="sf-facts-caption">
        {caption}
      </p>
    </section>
  );
}
