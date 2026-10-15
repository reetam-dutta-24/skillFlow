"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

const noSubscribe = () => () => {};

/**
 * Reduced motion, but only after hydration. The server cannot read the setting, so the first client render must
 * match it; the setting takes over on the next render. Used by the lesson wizard and the Home tour.
 */
export function useCalmMotion() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

/** True once the component has hydrated on the client. Portals and `document` reads wait for it. */
export function useHydrated() {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
