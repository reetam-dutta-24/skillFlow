import { Chip } from "../core/Chip.jsx";
import { GlassCard } from "../core/GlassCard.jsx";
import { Icon } from "../core/Icon.jsx";
import { CtaLink } from "./CtaLink.jsx";

function StageRow({ stage }) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-3)",
        padding: "var(--space-4)",
        borderRadius: "var(--radius-panel)",
        border: "1px solid " + (stage.locked ? "var(--border-subtle)" : "var(--border-accent)"),
        background: stage.locked ? "var(--surface-lock)" : "var(--surface-card-accent)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: "var(--radius-btn-sm)",
          background: stage.locked ? "var(--surface-card)" : "var(--accent-quiet)",
          color: stage.locked ? "var(--text-muted)" : "var(--text-accent)",
          fontSize: "var(--text-2xs)",
          fontWeight: "var(--weight-bold)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {stage.index}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span
            style={{
              fontSize: "var(--text-subtitle)",
              fontWeight: "var(--weight-semibold)",
              color: stage.locked ? "var(--text-secondary)" : "var(--text-primary)",
            }}
          >
            {stage.title}
          </span>
          {stage.locked ? <Icon name="lock" size={14} color="var(--text-muted)" /> : null}
        </span>
        <span style={{ display: "block", marginTop: 2, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          {stage.status}
        </span>
      </span>
    </li>
  );
}

/** Landing hero. The preview shows a stage that stays closed until the explain-back passes. */
export function LandingHero({ content }) {
  const { preview } = content;

  return (
    <section id="welcome" className="sf-hero sf-section" aria-labelledby="landing-hero-title">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
        <Chip tone="accent" size="md">
          {content.eyebrow}
        </Chip>
        <h1 id="landing-hero-title" className="sf-display">
          {content.headline}
        </h1>
        <p className="sf-lead">{content.lead}</p>
        <div className="sf-cta-row">
          <CtaLink href={content.primaryCta.href}>{content.primaryCta.label}</CtaLink>
          <CtaLink href={content.secondaryCta.href} variant="outline">
            {content.secondaryCta.label}
          </CtaLink>
        </div>
        <p className="sf-skills-note">{content.skillsNote}</p>
      </div>

      <GlassCard style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-2xs)",
              fontWeight: "var(--weight-semibold)",
              letterSpacing: "var(--tracking-wide)",
              textTransform: "uppercase",
              color: "var(--text-faint)",
            }}
          >
            {preview.skill}
          </p>
          <Chip tone="lock">Next stage closed</Chip>
        </div>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {preview.stages.map((stage) => (
            <StageRow key={stage.index} stage={stage} />
          ))}
        </ol>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: "var(--text-sm-lh)", color: "var(--text-secondary)" }}>
          {preview.caption}
        </p>
      </GlassCard>
    </section>
  );
}
