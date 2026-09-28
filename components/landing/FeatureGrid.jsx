import { GlassCard } from "../core/GlassCard.jsx";
import { Icon } from "../core/Icon.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";

function FeatureIcon({ name }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: "var(--radius-panel)",
        background: "var(--accent-quiet)",
        color: "var(--text-accent)",
      }}
    >
      <Icon name={name} size={18} />
    </span>
  );
}

function Exchange({ exchange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
      <div
        style={{
          padding: "var(--space-4)",
          borderRadius: "var(--radius-panel)",
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
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
          Your explanation
        </p>
        <p style={{ margin: "6px 0 0", fontSize: "var(--text-body)", lineHeight: "var(--text-body-lh)", color: "var(--text-primary)" }}>
          {exchange.you}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          gap: "var(--space-3)",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-panel)",
          background: "var(--surface-card-accent)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <Icon name="message-square-quote" size={18} color="var(--accent)" />
        <div style={{ minWidth: 0 }}>
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
            Follow-up question
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "var(--text-body)", lineHeight: "var(--text-body-lh)", color: "var(--text-primary)" }}>
            {exchange.followUp}
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ feature }) {
  const lead = Boolean(feature.lead);
  return (
    <article className={lead ? "sf-feature-lead" : undefined} style={{ minWidth: 0 }}>
      <GlassCard
        tint={lead ? "accent" : "neutral"}
        className={lead ? "sf-lead-shadow" : undefined}
        style={{
          height: "100%",
          padding: lead ? "var(--space-8)" : "var(--space-5)",
          borderColor: lead ? "var(--border-accent)" : undefined,
          boxShadow: lead ? "var(--sf-lead-shadow)" : undefined,
          overflow: lead ? "visible" : undefined,
        }}
      >
        {lead ? (
          <div
            aria-hidden="true"
            style={{
              height: 3,
              width: 72,
              marginBottom: "var(--space-5)",
              borderRadius: "var(--radius-full)",
              backgroundImage: "var(--gradient-brand)",
            }}
          />
        ) : null}
        <FeatureIcon name={feature.icon} />
        <h3
          style={{
            margin: "var(--space-4) 0 0",
            fontSize: lead ? "var(--text-title)" : "var(--text-subtitle)",
            lineHeight: lead ? "var(--text-title-lh)" : "var(--text-subtitle-lh)",
            fontWeight: "var(--weight-bold)",
            letterSpacing: "var(--tracking-tight)",
            color: "var(--text-primary)",
          }}
        >
          {feature.title}
        </h3>
        <p
          style={{
            margin: "var(--space-3) 0 0",
            maxWidth: lead ? "42rem" : undefined,
            fontSize: "var(--text-sm)",
            lineHeight: "var(--text-sm-lh)",
            color: "var(--text-secondary)",
          }}
        >
          {feature.body}
        </p>
        {feature.exchange ? <Exchange exchange={feature.exchange} /> : null}
      </GlassCard>
    </article>
  );
}

/** Feature grid. The explain-back card is the one that spans the lead cell. */
export function FeatureGrid({ title, subtitle, features }) {
  return (
    <section id="features" className="sf-features sf-section" aria-labelledby="landing-features-title">
      <SectionHeader title={title} subtitle={subtitle} titleId="landing-features-title" />
      <div className="sf-feature-grid">
        {features.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
    </section>
  );
}
