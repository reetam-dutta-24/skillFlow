import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function ProgressLoading() {
  return (
    <div className="sf-progress" aria-busy="true">
      <p className="sf-review-live">Loading progress</p>
      <Skeleton width={160} height={36} />
      <Skeleton width="100%" height={96} radius="var(--radius-card)" />
      <Skeleton width="100%" height={280} radius="var(--radius-card)" />
    </div>
  );
}
