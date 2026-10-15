"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { useToast } from "@/components/feedback/Toast";
import { SCREEN_BANDS, type ScreenBand } from "@/lib/detox/questions";
import { saveDetoxCheckIn } from "../actions";

const FOCUS_LABELS = ["Hardly at all", "A little", "Some of the time", "Most of the time", "Very well"];

/** One minute a week: screen time and focus. It nudges the score and feeds the "life vs learning" chart. */
export function CheckInCard({ current, due }: { current: { screenBand: ScreenBand; focus: number } | null; due: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(!current);
  const [band, setBand] = useState<ScreenBand | null>(current?.screenBand ?? null);
  const [focus, setFocus] = useState<number | null>(current?.focus ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!band || !focus) {
      setError("Choose your screen time and your focus first.");
      return;
    }
    setPending(true);
    setError("");
    const result = await saveDetoxCheckIn({ screenBand: band, focus });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast("Check-in saved. Your score and next steps are up to date.");
    setEditing(false);
    router.refresh();
  }

  return (
    <section className="sf-dtx-card sf-dtx-checkin" id="checkin" aria-labelledby="dtx-checkin-title" data-due={due ? "true" : undefined}>
      <header>
        <p className="sf-dtx-kicker">
          <Icon name="calendar-check" size={14} /> Weekly check-in
        </p>
        <h2 id="dtx-checkin-title">📅 {current && !editing ? "This week is checked in" : "One minute for this week"}</h2>
        <p>Look at the screen-time number your phone reports, then answer honestly. It nudges your score by at most 10 points.</p>
      </header>
      {current && !editing ? (
        <div className="sf-dtx-checkin-done">
          <p>
            <Icon name="smartphone" size={16} /> {SCREEN_BANDS.find((item) => item.id === current.screenBand)?.label} a day
          </p>
          <p>
            <Icon name="crosshair" size={16} /> Focus {current.focus} of 5
          </p>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Change it
          </Button>
        </div>
      ) : (
        <div className="sf-dtx-checkin-form">
          <fieldset>
            <legend>Phone screen time a day, this week</legend>
            <div className="sf-dtx-chips">
              {SCREEN_BANDS.map((item) => (
                <label key={item.id} className="sf-dtx-chip" data-on={band === item.id ? "true" : undefined}>
                  <input type="radio" name="checkin-screen" value={item.id} checked={band === item.id} onChange={() => setBand(item.id)} />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>How well could you focus this week?</legend>
            <div className="sf-dtx-scale">
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value} className="sf-dtx-scale-option" data-on={focus === value ? "true" : undefined}>
                  <input type="radio" name="checkin-focus" value={value} checked={focus === value} onChange={() => setFocus(value)} />
                  <strong>{value}</strong>
                  <span className="sf-sr">{FOCUS_LABELS[value - 1]}</span>
                </label>
              ))}
            </div>
            <p className="sf-dtx-scale-ends" aria-hidden="true">
              <span>Hardly at all</span>
              <span>Very well</span>
            </p>
          </fieldset>
          {error ? (
            <p className="sf-auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="sf-dtx-checkin-actions">
            {current ? (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            ) : null}
            <Button variant="gradient" pending={pending} pendingLabel="Saving…" onClick={() => void save()}>
              Save check-in
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
