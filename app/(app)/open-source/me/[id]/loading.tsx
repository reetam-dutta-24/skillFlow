import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function MyContributionLoading() {
  return (
    <div className="sf-community-detail" aria-busy="true">
      <p className="sf-review-live">Loading your contribution</p>
      <Skeleton width="100%" height={320} radius="16px" />
      <Skeleton width="100%" height={200} radius="16px" />
    </div>
  );
}
