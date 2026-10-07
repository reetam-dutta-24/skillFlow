"use client";

import { useState } from "react";
import { WizardCard } from "@/components/forms/WizardCard";
import { submitEvent } from "@/app/(app)/nearby/actions";

type Niche = { slug: string; name: string };

export function SubmitEventForm({ niches, city }: { niches: Niche[]; city: string | null }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [skillSlug, setSkillSlug] = useState(niches[0]?.slug ?? "");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [online, setOnline] = useState(false);
  const [place, setPlace] = useState(city ?? "");
  const [venueName, setVenueName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError("");
  }

  function continueStep() {
    if (step === 0 && !skillSlug) {
      setError("Choose a niche.");
      return;
    }
    if (step === 1 && title.trim().length < 3) {
      setError("Add a title of at least 3 characters.");
      return;
    }
    if (step === 1 && !url.trim()) {
      setError("Add a link.");
      return;
    }
    if (step === 2) {
      const parsed = startsAt ? new Date(startsAt) : null;
      if (!parsed || Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        setError("Pick a date in the future.");
        return;
      }
      if (!online && !place.trim()) {
        setError("Add a city, or mark the event as online.");
        return;
      }
    }
    go(step + 1);
  }

  async function send() {
    const parsed = new Date(startsAt);
    if (Number.isNaN(parsed.getTime())) {
      setError("Pick a date in the future.");
      return;
    }
    setPending(true);
    setError("");
    const result = await submitEvent({
      skillSlug,
      title,
      url,
      startsAt: parsed.toISOString(),
      venueName,
      city: online ? "" : place,
      description,
      isOnline: online,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="sf-wizard-card sf-fill-wizard" role="status">
        <h2>Submitted</h2>
        <p>It shows up after a reviewer approves it.</p>
      </div>
    );
  }

  const nicheName = niches.find((niche) => niche.slug === skillSlug)?.name ?? skillSlug;
  const titles = ["Which niche?", "What is the event?", "When and where?", "Send it for review"];

  return (
    <WizardCard
      step={step}
      total={4}
      title={titles[step] ?? "Event"}
      direction={direction}
      onStep={go}
      onBack={() => go(step - 1)}
      onNext={step === 3 ? () => void send() : continueStep}
      nextLabel={step === 3 ? "Submit event" : "Continue"}
      pending={pending}
      error={error}
    >
      {step === 0 ? (
        <label>
          Niche
          <select value={skillSlug} onChange={(event) => setSkillSlug(event.target.value)}>
            {niches.map((niche) => (
              <option key={niche.slug} value={niche.slug}>{niche.name}</option>
            ))}
          </select>
        </label>
      ) : null}
      {step === 1 ? (
        <>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} maxLength={140} />
          </label>
          <label>
            Link
            <input value={url} onChange={(event) => setUrl(event.target.value)} type="url" maxLength={400} placeholder="https://" />
          </label>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <label>
            Date and time
            <input value={startsAt} onChange={(event) => setStartsAt(event.target.value)} type="datetime-local" />
          </label>
          <label className="sf-event-check">
            <input type="checkbox" checked={online} onChange={(event) => setOnline(event.target.checked)} />
            Online event
          </label>
          {online ? null : (
            <label>
              City
              <input value={place} onChange={(event) => setPlace(event.target.value)} maxLength={80} />
            </label>
          )}
          <label>
            Venue
            <input value={venueName} onChange={(event) => setVenueName(event.target.value)} maxLength={120} />
          </label>
        </>
      ) : null}
      {step === 3 ? (
        <>
          <ul className="sf-fill-summary">
            <li>{nicheName}</li>
            <li>{title}</li>
            <li>{online ? "Online" : place}{venueName ? ` · ${venueName}` : ""}</li>
          </ul>
          <label>
            Details
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={4} />
          </label>
        </>
      ) : null}
    </WizardCard>
  );
}
