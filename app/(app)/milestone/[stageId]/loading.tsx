import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function MilestoneLoading() {
  return (
    <div className="sf-milestone" aria-busy="true">
      <p className="sf-sr">Loading explain-back</p>
      <Skeleton width="8rem" height={16} />
      <Skeleton width="18rem" height={32} />
      <Skeleton width="16rem" height={18} />
      <Skeleton height={140} radius="var(--radius-panel)" />
      <Skeleton width="11rem" height={44} radius="var(--radius-btn)" />
    </div>
  );
}
