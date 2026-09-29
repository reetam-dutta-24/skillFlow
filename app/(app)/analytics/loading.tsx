import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function AnalyticsLoading() {
  return (
    <div className="sf-analytics" aria-busy="true" aria-live="polite">
      <p className="sf-review-live">Loading analytics</p>
      <Skeleton width={180} height={36} />
      <Skeleton width="100%" height={88} radius="var(--radius-card)" />
      <Skeleton width="100%" height={480} radius="var(--radius-card)" />
    </div>
  );
}
