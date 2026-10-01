"use client";

import { useState } from "react";
import { Button } from "@/components/core/Button.jsx";

export function UpgradePanel({ priceLabel, premium }: { priceLabel: string; premium: boolean }) {
  const [notice, setNotice] = useState("");
  return (
    <div className="sf-upgrade">
      <table>
        <caption>Free and premium</caption>
        <thead>
          <tr><th scope="col"> </th><th scope="col">Free</th><th scope="col">Premium</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row">Roadmaps and explain-back</th><td>Included</td><td>Included</td></tr>
          <tr><th scope="row">Deeper mentor explanations</th><td>Not included</td><td>Included</td></tr>
          <tr><th scope="row">Advanced analytics</th><td>Not included</td><td>Included</td></tr>
          <tr><th scope="row">Premium roadmaps</th><td>Not included</td><td>Included</td></tr>
        </tbody>
      </table>
      <p>Price: {priceLabel}. Not a real charge.</p>
      {premium ? (
        <Button type="button" variant="outline" onClick={() => setNotice("This would open the subscription portal.")}>Manage subscription</Button>
      ) : (
        <Button type="button" variant="gradient" onClick={() => setNotice("This would open Stripe Checkout. No card is collected here.")}>Upgrade with Stripe Checkout</Button>
      )}
      {notice ? <p role="status">{notice}</p> : null}
    </div>
  );
}
