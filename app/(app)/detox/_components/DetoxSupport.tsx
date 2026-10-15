import { Icon } from "@/components/core/Icon.jsx";
import { NOT_MEDICAL, SUPPORT_LINES } from "@/lib/detox/state";

/**
 * Shown instead of detox tips when the self-check answers point to very low mood or feeling overwhelmed most days.
 * No model is called for this branch. Calm, short, and with a real number to call.
 */
export function DetoxSupport({ compact = false }: { compact?: boolean }) {
  return (
    <section className="sf-dtx-support" data-compact={compact ? "true" : undefined} aria-labelledby={compact ? "dtx-support-home" : "dtx-support-title"}>
      <span className="sf-dtx-support-icon" aria-hidden="true">
        <Icon name="heart-handshake" size={22} />
      </span>
      <div>
        <h2 id={compact ? "dtx-support-home" : "dtx-support-title"}>It sounds like things have been heavy lately</h2>
        <p>
          Thank you for answering honestly. Before any detox steps, please look after yourself. Talking to someone you trust, or to a
          trained counsellor, can help, and it is free.
        </p>
        <ul className="sf-dtx-support-lines">
          {SUPPORT_LINES.map((line) => (
            <li key={line.name}>
              <strong>{line.name}</strong>
              <span>
                {line.numbers.map((number, index) => (
                  <span key={number}>
                    {index > 0 ? " or " : ""}
                    <a href={`tel:${number.replace(/-/g, "")}`}>{number}</a>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        {compact ? null : (
          <p className="sf-dtx-quiet">
            If you are outside India, your local emergency number or health service can point you to a helpline. {NOT_MEDICAL} Your learning
            and your score stay here whenever you want them.
          </p>
        )}
      </div>
    </section>
  );
}
