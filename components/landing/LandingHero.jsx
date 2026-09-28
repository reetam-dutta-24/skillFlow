import { CtaLink } from "./CtaLink.jsx";

/** Full-bleed hero. The media layer is a slot for a background image. Copy sits low and centered, under a vignette. */
export function LandingHero({ content }) {
  return (
    <section id="home" className="sf-hero" aria-labelledby="landing-hero-title">
      <div className="sf-hero-media" aria-hidden="true" />
      <div className="sf-hero-vignette" aria-hidden="true" />
      <div className="sf-hero-copy">
        <h1 id="landing-hero-title" className="sf-display">
          {content.headline}
        </h1>
        <p className="sf-lead">{content.lead}</p>
        <div className="sf-cta-row">
          <CtaLink href={content.startCta.href}>{content.startCta.label}</CtaLink>
          <CtaLink href={content.heroSecondary.href} variant="outline">
            {content.heroSecondary.label}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
