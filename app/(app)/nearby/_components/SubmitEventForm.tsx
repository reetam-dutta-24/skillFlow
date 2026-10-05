"use client";

import { useState } from "react";
import { submitEvent } from "@/app/(app)/nearby/actions";

type Niche = { slug: string; name: string };

export function SubmitEventForm({ niches, city }: { niches: Niche[]; city: string | null }) {
  const [online, setOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  if (done) {
    return <p className="sf-event-card">Submitted. It shows up after a reviewer approves it.</p>;
  }

  return (
    <form
      className="sf-event-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const rawDate = String(form.get("startsAt") ?? "");
        const parsedDate = rawDate ? new Date(rawDate) : null;
        if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
          setError("Pick a date in the future.");
          return;
        }
        const startsAt = parsedDate.toISOString();
        setPending(true);
        setError(null);
        void submitEvent({
          skillSlug: String(form.get("skillSlug") ?? ""),
          title: String(form.get("title") ?? ""),
          url: String(form.get("url") ?? ""),
          startsAt,
          venueName: String(form.get("venueName") ?? ""),
          city: online ? "" : String(form.get("city") ?? ""),
          description: String(form.get("description") ?? ""),
          isOnline: online,
        }).then((result) => {
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setDone(true);
        });
      }}
    >
      <label>
        Niche
        <select name="skillSlug" required defaultValue={niches[0]?.slug ?? ""}>
          {niches.map((niche) => (
            <option key={niche.slug} value={niche.slug}>
              {niche.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Title
        <input name="title" required minLength={3} maxLength={140} />
      </label>
      <label>
        Link
        <input name="url" type="url" required maxLength={400} placeholder="https://" />
      </label>
      <label>
        Date and time
        <input name="startsAt" type="datetime-local" required />
      </label>
      <label className="sf-event-check">
        <input type="checkbox" checked={online} onChange={(event) => setOnline(event.target.checked)} />
        Online event
      </label>
      {online ? null : (
        <label>
          City
          <input name="city" required maxLength={80} defaultValue={city ?? ""} />
        </label>
      )}
      <label>
        Venue
        <input name="venueName" maxLength={120} />
      </label>
      <label>
        Details
        <textarea name="description" maxLength={1000} rows={4} />
      </label>
      {error ? <p className="sf-event-error">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Submitting" : "Submit event"}
      </button>
    </form>
  );
}
