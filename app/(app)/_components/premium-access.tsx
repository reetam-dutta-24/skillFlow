"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const PremiumAccessContext = createContext(false);
const SetPremiumAccessContext = createContext<(premium: boolean) => void>(() => {});

/**
 * Personal. The cached niche grid reads this so a subscriber can open a Premium niche.
 * Starts false and is filled in by PublishPremiumAccess, which streams in on the request,
 * so the signed-in shell never waits on the session.
 */
export function PremiumAccessProvider({ children }: { children: ReactNode }) {
  const [premium, setPremium] = useState(false);
  return (
    <SetPremiumAccessContext.Provider value={setPremium}>
      <PremiumAccessContext.Provider value={premium}>{children}</PremiumAccessContext.Provider>
    </SetPremiumAccessContext.Provider>
  );
}

export function usePremiumAccess() {
  return useContext(PremiumAccessContext);
}

/** Rendered inside Suspense by the app layout once the subscription is known. */
export function PublishPremiumAccess({ premium }: { premium: boolean }) {
  const setPremium = useContext(SetPremiumAccessContext);
  useEffect(() => {
    setPremium(premium);
  }, [premium, setPremium]);
  return null;
}
