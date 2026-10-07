"use client";

import { useEffect, useState } from "react";
import { MapCanvas, type MapFocus, type MapPoint } from "@/app/(app)/map/_components/MapCanvas";
import { formatDistanceKm } from "@/lib/geo/distance";
import { formatEventWhen, type EventView } from "@/lib/events/select";

function placeLine(event: EventView) {
  return [event.venueName, event.city].filter(Boolean).join(", ");
}

function posterImage(url: string | null) {
  return url?.startsWith("https://") ? url : null;
}

function EventPhoto({ event }: { event: EventView }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : posterImage(event.imageUrl);
  return (
    <span className="sf-event-photo">
      {src ? (
        // Event art comes from Ticketmaster and Google. The host is not known ahead of time.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className="sf-event-photo-fallback" aria-hidden="true">
          {event.title.slice(0, 1)}
        </span>
      )}
      <span className="sf-event-veil" aria-hidden="true" />
      <span className="sf-event-photo-copy">
        <span className="sf-event-kicker">{event.sourceLabel}</span>
        <h3>{event.title}</h3>
      </span>
    </span>
  );
}

function EventCard({
  event,
  selected,
  onSelect,
}: {
  event: EventView;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  const place = placeLine(event);
  const where = [place, event.distanceKm != null ? formatDistanceKm(event.distanceKm) : null].filter(Boolean).join(" · ");
  const meta = (
    <span className="sf-event-meta">
      <span>{formatEventWhen(event.startsAt)}</span>
      {where ? <span>{where}</span> : null}
      <span>{event.niche}</span>
    </span>
  );
  return (
    <article id={`event-${event.id}`} className={selected ? "sf-event-poster is-selected" : "sf-event-poster"}>
      {onSelect ? (
        <button type="button" className="sf-event-poster-hit" onClick={() => onSelect(event.id)}>
          <EventPhoto event={event} />
          {meta}
        </button>
      ) : (
        <div className="sf-event-poster-hit">
          <EventPhoto event={event} />
          {meta}
        </div>
      )}
      <a className="sf-event-open" href={event.url} target="_blank" rel="noreferrer">
        Open event
      </a>
    </article>
  );
}

export function EventsBoard({
  events,
  origin = null,
  empty = "No events in this range.",
}: {
  events: EventView[];
  origin?: MapFocus | null;
  empty?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const points: MapPoint[] = events.flatMap((event) => {
    if (event.lat == null || event.lng == null) return [];
    const place = placeLine(event);
    return [
      {
        id: event.id,
        lat: event.lat,
        lng: event.lng,
        count: 1,
        title: event.title,
        detail: place || formatEventWhen(event.startsAt),
      },
    ];
  });

  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`event-${selectedId}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <div className="sf-event-layout">
      <MapCanvas
        points={points}
        focus={origin}
        selectedId={selectedId}
        onSelect={setSelectedId}
        noun="event"
        fitMaxZoom={13}
        ariaLabel="Map of nearby events"
      />
      <div className="sf-event-list" aria-label="Events near you">
        {events.length === 0 ? (
          <p className="sf-event-empty">{empty}</p>
        ) : (
          events.map((event) => (
            <EventCard key={event.id} event={event} selected={event.id === selectedId} onSelect={setSelectedId} />
          ))
        )}
      </div>
    </div>
  );
}

export function OnlineEventList({
  events,
  title = "Online",
  empty = "No online events in this range.",
}: {
  events: EventView[];
  title?: string;
  empty?: string;
}) {
  return (
    <section className="sf-event-online" aria-label={title}>
      <h2>{title}</h2>
      {events.length === 0 ? (
        <p className="sf-event-empty">{empty}</p>
      ) : (
        <div className="sf-event-online-list">
          {events.map((event) => (
            <EventCard key={event.id} event={event} selected={false} />
          ))}
        </div>
      )}
    </section>
  );
}
