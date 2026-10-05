"use client";

import { useRouter } from "next/navigation";
import { DATE_RANGES, DISTANCE_OPTIONS, type DateRangeId, type DistanceKm } from "@/lib/events/config";

export function EventFilters({
  niche,
  when,
  km,
  showDistance,
}: {
  niche: string | null;
  when: DateRangeId;
  km: DistanceKm;
  showDistance: boolean;
}) {
  const router = useRouter();

  function push(next: { when?: DateRangeId; km?: DistanceKm }) {
    const params = new URLSearchParams();
    if (niche) params.set("niche", niche);
    params.set("when", next.when ?? when);
    if (showDistance) params.set("km", String(next.km ?? km));
    router.push(`/nearby/events?${params.toString()}`);
  }

  return (
    <div className="sf-event-filters">
      <label>
        When
        <select value={when} onChange={(event) => push({ when: event.target.value as DateRangeId })}>
          {Object.entries(DATE_RANGES).map(([id, range]) => (
            <option key={id} value={id}>
              {range.label}
            </option>
          ))}
        </select>
      </label>
      {showDistance ? (
        <label>
          Distance
          <select value={String(km)} onChange={(event) => push({ km: Number(event.target.value) as DistanceKm })}>
            {DISTANCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} km
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
