import { Icon } from "@/components/core/Icon.jsx";

/**
 * A drawing of the idea, not anyone's data: a dial easing up, and the three kinds of proof that move it. Used on the
 * Detox welcome and on the landing page. Static markup, so it renders the same on the server and in the browser.
 */
export function DetoxIllustration({ label = "An illustration of the Detox Score rising with learning" }: { label?: string }) {
  return (
    <figure className="sf-dtx-illus" role="img" aria-label={label}>
      <svg viewBox="0 0 260 150" aria-hidden="true">
        <defs>
          <linearGradient id="sf-dtx-illus-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--gauge-from)" />
            <stop offset="100%" stopColor="var(--gauge-to)" />
          </linearGradient>
        </defs>
        <path className="sf-gauge-band" d="M 26.0 128.0 A 104 104 0 0 1 81.0 36.2" stroke="var(--viz-2)" />
        <path className="sf-gauge-band" d="M 84.5 34.5 A 104 104 0 0 1 144.3 25.0" stroke="var(--viz-4)" />
        <path className="sf-gauge-band" d="M 148.2 25.6 A 104 104 0 0 1 202.1 53.1" stroke="var(--viz-3)" />
        <path className="sf-gauge-band" d="M 204.9 55.9 A 104 104 0 0 1 234.0 128.0" stroke="var(--viz-1)" />
        <path className="sf-gauge-track" d="M 42 128 A 88 88 0 0 1 218 128" />
        <path className="sf-gauge-fill sf-dtx-illus-fill" d="M 42.0 128.0 A 88 88 0 0 1 172.4 50.9" stroke="url(#sf-dtx-illus-grad)" />
        <circle className="sf-gauge-knob" cx="172.4" cy="50.9" r="9" />
      </svg>
      <figcaption className="sf-dtx-illus-center" aria-hidden="true">
        <strong>+32</strong>
        <span>Steady</span>
      </figcaption>
      <span className="sf-dtx-illus-chip" data-pos="a" aria-hidden="true">
        <Icon name="message-square-quote" size={14} /> 3 ideas passed
      </span>
      <span className="sf-dtx-illus-chip" data-pos="b" aria-hidden="true">
        <Icon name="timer" size={14} /> 50 focused min
      </span>
      <span className="sf-dtx-illus-chip" data-pos="c" aria-hidden="true">
        <Icon name="smartphone" size={14} /> screen time down 1 h
      </span>
    </figure>
  );
}
