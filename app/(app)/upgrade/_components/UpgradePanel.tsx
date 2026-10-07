"use client";

import { useState } from "react";

const INCLUDED = [
  "Thirty free paths, every stage, and the certificate",
  "Explain-back, notes, and nearby events",
  "The learner map, without your name on it",
];

const PREMIUM = [
  "Open and follow every niche outside the thirty free paths",
  "Appear on the learner map",
];

export function UpgradePanel({
  priceLabel,
  premium,
  canManage,
  configured,
  notice,
}: {
  priceLabel: string;
  premium: boolean;
  canManage: boolean;
  configured: boolean;
  notice: string;
}) {
  const [message, setMessage] = useState(notice);
  const [pending, setPending] = useState(false);

  async function openStripe(path: string) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(path, { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setMessage(data.error || "Stripe could not be opened.");
        setPending(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setMessage("Stripe could not be opened.");
      setPending(false);
    }
  }

  return (
    <div className="sf-billing">
      <section className="sf-billing-copy" aria-labelledby="plan-status">
        <p className="sf-path-kicker">{premium ? "Premium" : "Free plan"}</p>
        <h2 id="plan-status">{premium ? "This account includes Premium." : "You're on the free plan."}</h2>
        <p>
          {premium
            ? "The niches outside the thirty free paths are open, and this account can appear on the learner map."
            : "The thirty paths stay open. Premium is the way to open the other niches and to appear on the learner map."}
        </p>
        {message ? (
          <p className="sf-billing-notice" role="status">
            {message}
          </p>
        ) : null}
        <ul className="sf-billing-list">
          {INCLUDED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="sf-billing-card" aria-labelledby="premium-offer">
        <p className="sf-path-kicker">Premium</p>
        <h2 id="premium-offer">{priceLabel}</h2>
        <p>One subscription. The card form opens on Stripe, and SkillFlow never sees the card.</p>
        <ul>
          {PREMIUM.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {premium && canManage ? (
          <button type="button" className="sf-path-cta" disabled={pending || !configured} onClick={() => void openStripe("/api/stripe/portal")}>
            {pending ? "Opening…" : "Manage subscription"}
          </button>
        ) : null}
        {!premium ? (
          <button type="button" className="sf-path-cta" disabled={pending || !configured} onClick={() => void openStripe("/api/stripe/checkout")}>
            {pending ? "Opening Stripe…" : "Continue to checkout"}
          </button>
        ) : null}
        {!configured ? <p className="sf-billing-quiet">Stripe is not configured yet. Add the keys before a charge can start.</p> : null}
      </section>
    </div>
  );
}
