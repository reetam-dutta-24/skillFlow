import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function SubmitLoading() {
  return (
    <div className="sf-submit-page" aria-busy="true">
      <p className="sf-review-live">Loading submit</p>
      <Skeleton width="100%" height={280} radius="var(--radius-card)" />
    </div>
  );
}
