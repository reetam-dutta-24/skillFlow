import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function NotesLoading() {
  return (
    <div aria-busy="true">
      <p className="sf-review-live">Loading notes</p>
      <Skeleton width="100%" height={320} radius="var(--radius-card)" />
    </div>
  );
}
