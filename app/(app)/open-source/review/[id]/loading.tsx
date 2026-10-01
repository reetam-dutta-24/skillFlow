import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function ReviewItemLoading() {
  return (
    <div className="sf-community-detail" aria-busy="true">
      <p className="sf-review-live">Loading the contribution</p>
      <Skeleton width="100%" height={320} radius="16px" />
      <Skeleton width="100%" height={220} radius="16px" />
    </div>
  );
}
