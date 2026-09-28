import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function QuizLoading() {
  return (
    <div className="sf-quiz" aria-busy="true">
      <p className="sf-sr">Loading quiz</p>
      <Skeleton width="8rem" height={16} />
      <Skeleton width="14rem" height={32} />
      <Skeleton width="9rem" height={14} />
      <Skeleton height={4} radius="var(--radius-full)" />
      <Skeleton height={28} />
      <Skeleton height={56} radius="var(--radius-panel)" />
      <Skeleton height={56} radius="var(--radius-panel)" />
      <Skeleton height={56} radius="var(--radius-panel)" />
      <Skeleton height={56} radius="var(--radius-panel)" />
      <Skeleton width="9rem" height={44} radius="var(--radius-btn)" />
    </div>
  );
}
