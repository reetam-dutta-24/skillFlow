import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function RoadmapDetailLoading() {
  return (
    <div className="sf-dash" aria-busy="true">
      <p className="sf-sr">Loading roadmap</p>
      <header className="sf-page-head">
        <Skeleton width="7rem" height={14} />
        <Skeleton width="16rem" height={28} style={{ marginTop: "var(--space-3)" }} />
        <Skeleton width="20rem" height={16} style={{ marginTop: "var(--space-2)" }} />
      </header>
      <div className="sf-dash-block">
        <Skeleton height={96} radius="var(--radius-card)" />
        <Skeleton height={96} radius="var(--radius-card)" />
        <Skeleton height={96} radius="var(--radius-card)" />
        <Skeleton height={96} radius="var(--radius-card)" />
        <Skeleton height={96} radius="var(--radius-card)" />
      </div>
    </div>
  );
}
