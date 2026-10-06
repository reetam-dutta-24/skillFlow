"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/core/Button.jsx";

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
      const data = (await response.json()) as { url?: string; publishableKey?: string; error?: string };
      if (!response.ok || !data.url) {
        setMessage(data.error || "Stripe could not be opened.");
        return;
      }
      if (data.publishableKey) await loadStripe(data.publishableKey);
      window.location.assign(data.url);
    } catch {
      setMessage("Stripe could not be opened.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="sf-upgrade">
      <table>
        <caption>Free and Premium</caption>
        <thead>
          <tr>
            <th scope="col"> </th>
            <th scope="col">Free</th>
            <th scope="col">Premium</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Thirty free paths, every stage, and the certificate</th>
            <td>Included</td>
            <td>Included</td>
          </tr>
          <tr>
            <th scope="row">Learner map and nearby events</th>
            <td>Included</td>
            <td>Included</td>
          </tr>
          <tr>
            <th scope="row">Niches outside the thirty free paths</th>
            <td>Not included</td>
            <td>Included</td>
          </tr>
          <tr>
            <th scope="row">Appear on the learner map</th>
            <td>Not included</td>
            <td>Included</td>
          </tr>
        </tbody>
      </table>
      <p>Price: {priceLabel}. The card form stays on Stripe.</p>
      {premium && canManage ? (
        <Button type="button" variant="outline" disabled={pending || !configured} onClick={() => void openStripe("/api/stripe/portal")}>
          {pending ? "Opening..." : "Manage subscription"}
        </Button>
      ) : null}
      {!premium ? (
        <Button type="button" variant="gradient" disabled={pending || !configured} onClick={() => void openStripe("/api/stripe/checkout")}>
          {pending ? "Opening..." : "Upgrade with Stripe Checkout"}
        </Button>
      ) : null}
      {!configured ? <p>Stripe is not configured yet. Add the keys before a charge can start.</p> : null}
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
