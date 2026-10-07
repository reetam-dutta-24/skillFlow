import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function NearbyLoading() {
  return (
    <div aria-busy="true">
      <p className="sf-review-live">Loading Nearby</p>
      <Skeleton width="100%" height={420} radius="var(--radius-tile)" />
    </div>
  );
}
