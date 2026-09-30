"use client";

import { useEffect } from "react";
import { applyStoredAccent, isStoredAccent } from "@/lib/accent";

/** Applies a saved preset or custom gradient from the learner profile. */
export function AccentSync({ accent }) {
  useEffect(() => {
    if (isStoredAccent(accent)) applyStoredAccent(accent);
  }, [accent]);
  return null;
}
