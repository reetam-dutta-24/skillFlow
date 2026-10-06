"use client";

import { createContext, useContext, type ReactNode } from "react";

const PremiumAccessContext = createContext(false);

/** Personal. The cached niche grid reads this so a subscriber can open a Premium niche. */
export function PremiumAccessProvider({ premium, children }: { premium: boolean; children: ReactNode }) {
  return <PremiumAccessContext.Provider value={premium}>{children}</PremiumAccessContext.Provider>;
}

export function usePremiumAccess() {
  return useContext(PremiumAccessContext);
}
