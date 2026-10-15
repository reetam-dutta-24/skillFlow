"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import type { DetoxWeek } from "@/lib/detox/score";

const DetoxCharts = dynamic(() => import("./DetoxCharts").then((mod) => mod.DetoxCharts), {
  ssr: false,
  loading: () => <Skeleton width="100%" height={420} radius="var(--radius-card)" />,
});

/** Recharts measures the browser, so the charts load on the client only, like Analytics. */
export function DetoxBoard(props: { weeks: DetoxWeek[]; baseline: number; score: number; mix: { kind: string; label: string; count: number }[] }) {
  return <DetoxCharts {...props} />;
}
