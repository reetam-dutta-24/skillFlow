import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function CreatorEditorLoading() {
  return (
    <div aria-busy="true">
      <p className="sf-review-live">Loading the video editor</p>
      <Skeleton width="100%" height={240} radius="var(--radius-card)" />
    </div>
  );
}
