import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function ClipsLoading() {
  return (
    <div className="sf-dash" aria-busy="true">
      <p className="sf-sr">Loading clips</p>
      <header className="sf-page-head">
        <Skeleton width="6rem" height={28} />
        <Skeleton width="18rem" height={16} style={{ marginTop: "var(--space-2)" }} />
      </header>
      <Skeleton width="16rem" height={40} radius="var(--radius-btn)" />
      <Skeleton width="min(100%, 380px)" height={560} radius="var(--radius-card)" />
    </div>
  );
}
