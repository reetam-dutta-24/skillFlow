import { GlassCard } from "../core/GlassCard.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";

/** Consented quotes only. The page renders this once at least three exist. */
export function ReviewsSection({ title, reviews }) {
  return (
    <section id="reviews" className="sf-section sf-band-sink" aria-labelledby="landing-reviews-title">
      <SectionHeader
        align="center"
        className="sf-section-head"
        title={title}
        titleId="landing-reviews-title"
        titleSize="var(--text-section)"
      />
      <ul className="sf-reviews">
        {reviews.map((review) => (
          <li key={`${review.name}-${review.quote}`}>
            <GlassCard style={{ height: "100%", padding: "var(--space-8)" }}>
              <figure className="sf-review">
                <blockquote>
                  <p>{review.quote}</p>
                </blockquote>
                <figcaption>
                  <span className="sf-review-name">{review.name}</span>
                  <span className="sf-review-role">{review.role}</span>
                </figcaption>
              </figure>
            </GlassCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
