import { GlassCard } from "../core/GlassCard.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";

/** Four-step path from choosing a skill to the explain-back that opens the next stage. */
export function HowItWorks({ title, subtitle, steps }) {
  return (
    <section id="how" className="sf-section sf-band-raise" aria-labelledby="landing-how-title">
      <SectionHeader title={title} subtitle={subtitle} titleId="landing-how-title" titleSize="var(--text-section)" subtitleSize="var(--text-section-sub)" />
      <ol className="sf-steps">
        {steps.map((step) => (
          <li key={step.index}>
            <GlassCard style={{ height: "100%", padding: "var(--space-5)" }}>
              <span className="sf-step-index">{step.index}</span>
              <h3 className="sf-step-title">{step.title}</h3>
              <p className="sf-step-body">{step.body}</p>
            </GlassCard>
          </li>
        ))}
      </ol>
    </section>
  );
}
