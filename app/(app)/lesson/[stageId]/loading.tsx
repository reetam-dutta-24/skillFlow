import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function LessonLoading() {
  return (
    <div className="sf-lesson" aria-busy="true">
      <p className="sf-sr">Loading lesson</p>
      <Skeleton width="8rem" height={16} />
      <Skeleton width="16rem" height={28} />
      <Skeleton height={360} radius="var(--radius-card)" />
      <Skeleton height={72} radius="var(--radius-panel)" />
      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <Skeleton width="10rem" height={44} radius="var(--radius-btn)" />
        <Skeleton width="10rem" height={44} radius="var(--radius-btn)" />
      </div>
    </div>
  );
}
