import { SectionHeader } from "../core/SectionHeader.jsx";

/** Split feature rows. Each media frame is an empty slot for a later image or video. */
export function FeatureGrid({ title, subtitle, features }) {
  return (
    <section id="features" className="sf-features sf-section sf-band-sink" aria-labelledby="landing-features-title">
      <SectionHeader
        align="center"
        className="sf-section-head"
        title={title}
        subtitle={subtitle}
        titleId="landing-features-title"
        titleSize="var(--text-section)"
        subtitleSize="var(--text-section-sub)"
      />
      <div className="sf-feature-rows">
        {features.map((feature, index) => (
          <article key={feature.id} className={index % 2 === 1 ? "sf-feature-row is-flip" : "sf-feature-row"}>
            <div className="sf-feature-media" role="img" aria-label={`${feature.mediaLabel} image or video, coming later`}>
              <span>Image or video</span>
            </div>
            <div className="sf-feature-copy">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              <ul>
                {feature.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
