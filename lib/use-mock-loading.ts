"use client";

import { useEffect, useState } from "react";

// Simulates the delay of a real data fetch. Stands in for the async load
// that will replace lib/mock-data.ts once pages are wired to Prisma.
export function useMockLoading(delayMs = 500) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return loading;
}
