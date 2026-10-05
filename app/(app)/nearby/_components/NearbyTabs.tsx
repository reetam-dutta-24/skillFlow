import Link from "next/link";

export function NearbyTabs({ tab, niche }: { tab: "learners" | "events"; niche: string | null }) {
  const learners = niche ? `/nearby?niche=${encodeURIComponent(niche)}` : "/nearby";
  const events = niche ? `/nearby/events?niche=${encodeURIComponent(niche)}` : "/nearby/events";
  return (
    <nav className="sf-nearby-tabs" aria-label="Nearby">
      <Link href={learners} aria-current={tab === "learners" ? "page" : undefined}>
        Learners
      </Link>
      <Link href={events} aria-current={tab === "events" ? "page" : undefined}>
        Events
      </Link>
    </nav>
  );
}
