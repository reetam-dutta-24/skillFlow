import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function CreatorLoading() {
  return (
    <div aria-busy="true">
      <p className="sf-review-live">Loading creator</p>
      <Skeleton width="100%" height={240} radius="var(--radius-card)" />
    </div>
  );
}
