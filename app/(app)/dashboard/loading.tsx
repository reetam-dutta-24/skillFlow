import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function DashboardLoading() {
  return (
    <div className="sf-dash" aria-busy="true">
      <p className="sf-sr">Loading home</p>
      <header className="sf-page-head">
        <Skeleton width="6rem" height={28} />
        <Skeleton width="12rem" height={16} style={{ marginTop: "var(--space-2)" }} />
      </header>
      <Skeleton height={92} radius="var(--radius-card)" />
      <div className="sf-dash-stats">
        <Skeleton width="8rem" height={20} />
        <div className="sf-stat-grid">
          <Skeleton height={96} radius="var(--radius-panel)" />
          <Skeleton height={96} radius="var(--radius-panel)" />
          <Skeleton height={96} radius="var(--radius-panel)" />
          <Skeleton height={96} radius="var(--radius-panel)" />
        </div>
      </div>
    </div>
  );
}
