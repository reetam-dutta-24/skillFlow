import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function UpgradeLoading() {
  return (
    <div aria-busy="true">
      <p className="sf-review-live">Loading upgrade</p>
      <Skeleton width="100%" height={240} radius="var(--radius-card)" />
    </div>
  );
}
