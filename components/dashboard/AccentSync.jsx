"use client";

import { useEffect } from "react";
import { applyAccent, isAccentId } from "@/lib/accent";

/** Applies the saved accent from the learner profile. */
export function AccentSync({ accent }) {
  useEffect(() => {
    if (isAccentId(accent)) applyAccent(accent);
  }, [accent]);
  return null;
}
