import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function CommunityNicheLoading() {
  return (
    <div className="sf-dash" aria-busy="true">
      <p className="sf-review-live">Loading this community</p>
      <Skeleton width="40%" height={28} />
      <Skeleton width="100%" height={18} />
      <Skeleton width="100%" height={160} radius="16px" />
    </div>
  );
}
