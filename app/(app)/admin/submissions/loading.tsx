import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function AdminLoading() {
  return (
    <div aria-busy="true">
      <p className="sf-review-live">Loading submissions</p>
      <Skeleton width="100%" height={280} radius="var(--radius-card)" />
    </div>
  );
}
