import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function SettingsLoading() {
  return (
    <div className="sf-settings-page" aria-busy="true">
      <p className="sf-review-live">Loading settings</p>
      <Skeleton width="100%" height={160} radius="var(--radius-card)" />
      <Skeleton width="100%" height={160} radius="var(--radius-card)" />
    </div>
  );
}
