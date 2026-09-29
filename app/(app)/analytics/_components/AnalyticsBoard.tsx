"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import type { AnalyticsData } from "@/lib/data/analytics";

const AnalyticsCharts = dynamic(() => import("./AnalyticsCharts").then((mod) => mod.AnalyticsCharts), {
  ssr: false,
  loading: () => <Skeleton width="100%" height={480} radius="var(--radius-card)" />,
});

export function AnalyticsBoard({ data }: { data: AnalyticsData }) {
  return <AnalyticsCharts data={data} />;
}
