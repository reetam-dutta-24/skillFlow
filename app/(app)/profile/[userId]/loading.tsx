import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function ProfileLoading() {
  return (
    <div className="sf-creator-page" aria-busy="true">
      <p className="sf-review-live">Loading profile</p>
      <Skeleton width="40%" height={36} radius="12px" />
      <Skeleton width="100%" height={220} radius="var(--radius-tile)" />
    </div>
  );
}
