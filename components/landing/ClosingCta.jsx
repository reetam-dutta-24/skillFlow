import { GlassCard } from "../core/GlassCard.jsx";
import { CtaLink } from "./CtaLink.jsx";

/** Last prompt before the footer. One action, then the free-to-start note. */
export function ClosingCta({ title, note, cta }) {
  return (
    <section id="start" className="sf-section sf-band-raise" aria-labelledby="landing-closing-title">
      <GlassCard
        tint="accent"
        style={{
          padding: "clamp(3rem, 6vh, 4.5rem) clamp(1.5rem, 4vw, 3rem)",
          textAlign: "center",
          borderColor: "var(--border-accent)",
        }}
      >
        <h2 id="landing-closing-title" className="sf-closing-title">
          {title}
        </h2>
        <div className="sf-cta-row" style={{ justifyContent: "center" }}>
          <CtaLink href={cta.href}>{cta.label}</CtaLink>
        </div>
        <p className="sf-closing-note">{note}</p>
      </GlassCard>
    </section>
  );
}
