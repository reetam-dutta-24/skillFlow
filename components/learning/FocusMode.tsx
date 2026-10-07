"use client";

import { useEffect } from "react";

/**
 * Turns on the calm layout while this screen is open: the sidebar steps aside and the column narrows.
 * The page's breadcrumb is the way out. Removed again as soon as the learner leaves.
 */
export function FocusMode() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.focus = "true";
    return () => {
      delete root.dataset.focus;
    };
  }, []);
  return null;
}
