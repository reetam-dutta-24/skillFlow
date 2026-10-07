import Link from "next/link";

/**
 * Personal. Render only when this account does not have Premium.
 * `compact` is a single quiet line for pages where learning comes first (Home).
 */
export function FreePlanNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <aside className="sf-plan-line" aria-label="Free plan">
        <p>
          <strong>Free plan.</strong> Thirty paths, every stage, explain-back, and the certificate are free. Premium opens the other niches and a
          place on the learner map.
        </p>
        <Link href="/upgrade">See Premium</Link>
      </aside>
    );
  }
  return (
    <aside className="sf-plan-banner" aria-label="Free plan">
      <div>
        <p className="sf-path-kicker">Free plan</p>
        <p className="sf-plan-banner-title">You&apos;re on the free plan.</p>
        <ul>
          <li>Thirty paths, every stage, explain-back, and the certificate stay free.</li>
          <li>Premium opens the niches outside those paths, so you can follow them.</li>
          <li>Premium lets you appear on the learner map. The map itself stays free.</li>
        </ul>
      </div>
      <Link className="sf-path-cta" href="/upgrade">
        See Premium
      </Link>
    </aside>
  );
}
