import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function ByorLoading() {
  return (
    <div aria-busy="true">
      <p className="sf-review-live">Loading bring your own resource</p>
      <Skeleton width="100%" height={220} radius="var(--radius-card)" />
    </div>
  );
}
