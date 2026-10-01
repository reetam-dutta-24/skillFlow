import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function ReviewQueueLoading() {
  return (
    <div className="sf-os-feed-list" aria-busy="true">
      <p className="sf-review-live">Loading the review queue</p>
      <Skeleton width="100%" height={96} radius="16px" />
      <Skeleton width="100%" height={96} radius="16px" />
      <Skeleton width="100%" height={96} radius="16px" />
    </div>
  );
}
