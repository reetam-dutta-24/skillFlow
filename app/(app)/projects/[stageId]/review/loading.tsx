import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function ProjectLoading() {
  return (
    <div aria-busy="true">
      <p className="sf-review-live">Loading project review</p>
      <Skeleton width="100%" height={280} radius="var(--radius-card)" />
    </div>
  );
}
