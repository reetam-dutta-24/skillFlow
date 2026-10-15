"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import type { DetoxWeek } from "@/lib/detox/score";

const DetoxCharts = dynamic(() => import("./DetoxCharts").then((mod) => mod.DetoxCharts), {
  ssr: false,
  loading: () => <Skeleton width="100%" height={420} radius="var(--radius-card)" />,
});

const DetoxScoreChart = dynamic(() => import("./DetoxCharts").then((mod) => mod.DetoxScoreChart), {
  ssr: false,
  loading: () => <Skeleton width="100%" height={320} radius="var(--radius-card)" />,
});

/** Only the score-over-time chart, for the Analytics Detox section. */
export function DetoxScoreBoard(props: { weeks: DetoxWeek[]; baseline: number; score: number }) {
  return <DetoxScoreChart {...props} />;
}

/** Recharts measures the browser, so the charts load on the client only, like Analytics. */
export function DetoxBoard(props: { weeks: DetoxWeek[]; baseline: number; score: number; mix: { kind: string; label: string; count: number }[] }) {
  return <DetoxCharts {...props} />;
}
