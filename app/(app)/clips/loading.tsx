import { Skeleton } from "@/components/feedback/Skeleton.jsx";

export default function ClipsLoading() {
  return (
    <div className="sf-clips-page" aria-busy="true">
      <p className="sf-sr">Loading clips</p>
      <Skeleton width="8rem" height={28} />
      <Skeleton width="16rem" height={40} radius="var(--radius-btn)" />
      <Skeleton width="min(100%, calc(70svh * 9 / 16))" height="70svh" radius="16px" />
    </div>
  );
}
