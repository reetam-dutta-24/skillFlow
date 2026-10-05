"use client";

import { useEffect, useState } from "react";
import { MapCanvas, type MapPoint } from "@/app/(app)/map/_components/MapCanvas";
import { formatDistanceKm } from "@/lib/geo/distance";
import { formatEventWhen, type EventView } from "@/lib/events/select";

function placeLine(event: EventView) {
  return [event.venueName, event.city].filter(Boolean).join(", ");
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
  return (
    <article id={`event-${event.id}`} className={selected ? "sf-event-card is-selected" : "sf-event-card"}>
      {onSelect ? (
        <button type="button" className="sf-event-select" onClick={() => onSelect(event.id)}>
          <CardBody event={event} place={place} />
        </button>
      ) : (
        <CardBody event={event} place={place} />
      )}
      <a href={event.url} target="_blank" rel="noreferrer">
        Open event
      </a>
    </article>
  );
}

function CardBody({ event, place }: { event: EventView; place: string }) {
  return (
    <>
      <h3>{event.title}</h3>
      <p>{formatEventWhen(event.startsAt)}</p>
      {place ? <p>{place}</p> : null}
      {event.distanceKm != null ? <p>{formatDistanceKm(event.distanceKm)}</p> : null}
      <p>
        <span>{event.niche}</span>
        <span>{event.sourceLabel}</span>
      </p>
    </>
  );
}

export function EventsBoard({ events, empty = "No events in this range." }: { events: EventView[]; empty?: string }) {
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
        selectedId={selectedId}
        onSelect={setSelectedId}
        noun="event"
        fitMaxZoom={11}
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
