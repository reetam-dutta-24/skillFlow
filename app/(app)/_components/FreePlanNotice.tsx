import Link from "next/link";

/** Personal. Render only when this account does not have Premium. */
export function FreePlanNotice() {
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
