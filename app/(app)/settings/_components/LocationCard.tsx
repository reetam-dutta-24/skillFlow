"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsSection } from "@/components/forms/SettingsSection.jsx";
import { SettingsToggle } from "@/components/forms/SettingsToggle.jsx";
import { Button } from "@/components/core/Button.jsx";
import { clearMapCity, saveMapCity, searchMapCities, setMapVisibility } from "../location-actions";
import type { CityHit } from "@/lib/geo/cities";

type SavedCity = {
  hasProfile: boolean;
  city: string | null;
  country: string | null;
  showOnMap: boolean;
};

export function LocationCard({ map, canShare }: { map: SavedCity; canShare: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CityHit[]>([]);
  const [picked, setPicked] = useState<CityHit | null>(null);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [optimisticVisible, setOptimisticVisible] = useState<boolean | null>(null);
  const visible = optimisticVisible ?? map.showOnMap;
  const saved = map.city && map.country ? `${map.city}, ${map.country}` : "";
  const timer = useRef(0);
  const request = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function onQuery(value: string) {
    setQuery(value);
    setPicked(null);
    window.clearTimeout(timer.current);
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    const id = request.current + 1;
    request.current = id;
    setSearching(true);
    timer.current = window.setTimeout(() => {
      void searchMapCities(trimmed).then((result) => {
        if (request.current !== id) return;
        setSearching(false);
        if (!result.ok) {
          setHits([]);
          setError(result.error);
          return;
        }
        setHits(result.cities);
      });
    }, 400);
  }

  async function save() {
    if (!picked) return;
    setPending("save");
    setNotice("");
    setError("");
    const result = await saveMapCity(picked);
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setQuery("");
    setHits([]);
    setPicked(null);
    setNotice("City saved. Turn on the map toggle if you want to be counted.");
    router.refresh();
  }

  async function remove() {
    setPending("remove");
    setNotice("");
    setError("");
    const result = await clearMapCity();
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOptimisticVisible(false);
    setNotice("City removed. You are not on the map.");
    router.refresh();
  }

  async function toggle(next: boolean) {
    setOptimisticVisible(next);
    setNotice("");
    setError("");
    const result = await setMapVisibility(next);
    if (!result.ok) {
      setOptimisticVisible(null);
      setError(result.error);
      return;
    }
    setNotice(next ? "You are counted on the learner map." : "You are hidden on the learner map.");
    router.refresh();
  }

  const status = error || notice;

  return (
    <SettingsSection
      title="City"
      subtitle="Optional. We store the city, the country, and the city centre. Nothing more precise."
    >
      <p className={status ? `sf-settings-banner${error ? " is-error" : ""}` : "sf-review-live"} aria-live="polite" role={error ? "alert" : "status"}>
        {status}
      </p>
      {saved ? (
        <p className="sf-location-saved">
          Saved city <strong>{saved}</strong>
        </p>
      ) : (
        <p className="sf-settings-note">No city saved yet.</p>
      )}
      <label>
        Search for a city
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Lisbon"
          autoComplete="off"
          aria-autocomplete="list"
          disabled={pending !== ""}
        />
      </label>
      {searching ? <p className="sf-settings-note">Searching…</p> : null}
      {hits.length > 0 ? (
        <ul className="sf-location-results" role="listbox" aria-label="Matching cities">
          {hits.map((hit) => {
            const selected = picked?.label === hit.label;
            return (
              <li key={hit.label}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={selected ? "is-selected" : undefined}
                  onClick={() => setPicked(hit)}
                >
                  {hit.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className="sf-settings-bar">
        <Button
          type="button"
          variant="gradient"
          disabled={!picked || pending !== ""}
          pending={pending === "save"}
          pendingLabel="Saving…"
          aria-describedby={picked ? undefined : "location-save-hint"}
          onClick={() => void save()}
        >
          Save city
        </Button>
        {saved ? (
          <Button type="button" variant="outline" disabled={pending !== ""} onClick={() => void remove()}>
            {pending === "remove" ? "Removing…" : "Remove city"}
          </Button>
        ) : null}
      </div>
      {picked || pending !== "" ? null : (
        <p className="sf-settings-hint" id="location-save-hint">
          Search above, then pick a city from the list to save it.
        </p>
      )}
      {canShare ? (
        <SettingsToggle
          label="Show me on the learner map"
          description="The map shows how many learners are in your city. It never shows your name."
          checked={visible}
          onChange={(next: boolean) => void toggle(next)}
        />
      ) : (
        <p className="sf-settings-note">
          Saving a city stays free, so Nearby can open on it. Appearing on the learner map is part of Premium.{" "}
          <Link href="/upgrade">Upgrade</Link>
        </p>
      )}
    </SettingsSection>
  );
}
