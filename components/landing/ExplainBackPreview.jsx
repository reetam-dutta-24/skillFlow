import { GlassCard } from "../core/GlassCard.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";

/** Static explain-back walkthrough. The words are an example, not a learner account. */
export function ExplainBackPreview({ check }) {
  return (
    <section className="sf-section sf-band-base" aria-labelledby="landing-check-title">
      <SectionHeader
        align="center"
        className="sf-section-head"
        title={check.title}
        titleId="landing-check-title"
        titleSize="var(--text-section)"
      />
      <GlassCard style={{ maxWidth: "42rem", margin: "0 auto", padding: "var(--space-8)" }}>
        <p className="sf-check-label">{check.label}</p>
        <div className="sf-check-block">
          <p className="sf-check-kicker">Question</p>
          <p className="sf-check-question">{check.question}</p>
        </div>
        <div className="sf-check-block">
          <p className="sf-check-kicker">Answer</p>
          <p className="sf-check-answer">{check.answer}</p>
        </div>
        <p className="sf-check-callout">{check.followUp}</p>
        <p className="sf-check-result">{check.result}</p>
      </GlassCard>
      <p className="sf-check-caption">{check.caption}</p>
    </section>
  );
}
