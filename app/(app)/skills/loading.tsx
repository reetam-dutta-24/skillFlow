import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function SkillsLoading() {
  return (
    <div className="sf-browse" aria-busy="true">
      <p className="sf-review-live">Loading skills</p>
      <Skeleton width="100%" height={52} radius="var(--radius-full)" />
      <Skeleton width="100%" height={280} radius="22px" />
    </div>
  );
}
