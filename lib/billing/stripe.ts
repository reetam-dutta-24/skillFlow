import "server-only";
import Stripe from "stripe";
import { billingConfig } from "@/lib/billing/config";

let client: Stripe | null = null;

export function getStripe() {
  const { secretKey, configured } = billingConfig();
  if (!configured || !secretKey) return null;
  if (!client) client = new Stripe(secretKey);
  return client;
}
