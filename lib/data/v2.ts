import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { PREMIUM_PRICE_LABEL } from "@/lib/mock/config";

export async function getUpgrade() {
  await devDelay();
  return { priceLabel: PREMIUM_PRICE_LABEL };
}
