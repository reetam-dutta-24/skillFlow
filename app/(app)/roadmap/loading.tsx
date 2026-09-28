import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function RoadmapIndexLoading() {
  return (
    <div className="sf-dash" aria-busy="true">
      <p className="sf-sr">Loading roadmaps</p>
      <header className="sf-page-head">
        <Skeleton width="9rem" height={28} />
        <Skeleton width="18rem" height={16} style={{ marginTop: "var(--space-2)" }} />
      </header>
      <div className="sf-dash-block">
        <Skeleton width="7rem" height={20} />
        <Skeleton height={140} radius="var(--radius-panel)" />
        <Skeleton height={140} radius="var(--radius-panel)" />
      </div>
      <div className="sf-dash-block">
        <Skeleton width="7rem" height={20} />
        <div className="sf-explore">
          <Skeleton height={220} radius="var(--radius-panel)" />
          <Skeleton height={220} radius="var(--radius-panel)" />
          <Skeleton height={220} radius="var(--radius-panel)" />
        </div>
      </div>
    </div>
  );
}
