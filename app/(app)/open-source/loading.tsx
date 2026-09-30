import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function OpenSourceLoading() {
  return (
    <div className="sf-os-split" aria-busy="true">
      <p className="sf-review-live">Loading contributions</p>
      <div className="sf-os-feed">
        <Skeleton width="100%" height={120} radius="16px" />
        <Skeleton width="100%" height={120} radius="16px" />
      </div>
      <div className="sf-os-rail">
        <Skeleton width="100%" height={72} radius="12px" />
        <Skeleton width="100%" height={180} radius="12px" />
      </div>
    </div>
  );
}
