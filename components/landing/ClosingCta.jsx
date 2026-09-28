import { GlassCard } from "../core/GlassCard.jsx";
import { CtaLink } from "./CtaLink.jsx";

/** Last prompt before the footer. Same two account actions as the navbar and the hero. */
export function ClosingCta({ title, body, primaryCta, secondaryCta }) {
  return (
    <section id="start" className="sf-section" aria-labelledby="landing-closing-title">
      <GlassCard
        tint="accent"
        style={{
          padding: "var(--space-8) var(--space-6)",
          textAlign: "center",
          borderColor: "var(--border-accent)",
        }}
      >
        <h2 id="landing-closing-title" className="sf-closing-title">
          {title}
        </h2>
        <p className="sf-closing-body">{body}</p>
        <div className="sf-cta-row" style={{ justifyContent: "center" }}>
          <CtaLink href={primaryCta.href}>{primaryCta.label}</CtaLink>
          <CtaLink href={secondaryCta.href} variant="outline">
            {secondaryCta.label}
          </CtaLink>
        </div>
      </GlassCard>
    </section>
  );
}
