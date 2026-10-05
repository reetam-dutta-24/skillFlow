"use client";

import { useState } from "react";
import type { EventView } from "@/lib/events/select";
import { searchLiveEvents } from "@/app/(app)/nearby/actions";
import { OnlineEventList } from "./EventsBoard";

export function LiveSearch({ city }: { city: string | null }) {
  const [keyword, setKeyword] = useState("");
  const [place, setPlace] = useState(city ?? "");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventView[] | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <section className="sf-event-card sf-event-live">
      <h2>Live search</h2>
      <p>Any keyword and city, straight from the connected sources. These results are not saved.</p>
      <form
        className="sf-event-form"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          void searchLiveEvents({ keyword, city: place }).then((result) => {
            setPending(false);
            if (!result.ok) {
              setEvents(null);
              setError(result.error);
              return;
            }
            setEvents(result.events);
          });
        }}
      >
        <label>
          Keyword
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} maxLength={80} required />
        </label>
        <label>
          City
          <input value={place} onChange={(event) => setPlace(event.target.value)} maxLength={80} required />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "Searching" : "Search"}
        </button>
      </form>
      {error ? <p className="sf-event-error">{error}</p> : null}
      {events ? <OnlineEventList events={events} title="Live results" empty="No events matched." /> : null}
    </section>
  );
}

export function PremiumCard() {
  return (
    <section className="sf-event-card">
      <h2>Live search</h2>
      <p>Premium · coming soon</p>
      <p>Search any keyword in a city, straight from the connected sources. This stays off until payments are on.</p>
    </section>
  );
}
