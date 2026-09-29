"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import type { ProgressPayload } from "@/lib/data/progress";

const ProgressCharts = dynamic(() => import("./ProgressCharts").then((mod) => mod.ProgressCharts), {
  loading: () => <Skeleton width="100%" height={360} radius="var(--radius-card)" />,
});

export function ProgressBoard({ data }: { data: ProgressPayload }) {
  return <ProgressCharts data={data} />;
}
