"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AccentPicker } from "@/components/forms/AccentPicker.jsx";
import { SettingsSection } from "@/components/forms/SettingsSection.jsx";
import { SettingsToggle } from "@/components/forms/SettingsToggle.jsx";
import { ThemeToggle } from "@/components/forms/ThemeToggle.jsx";
import { Button } from "@/components/core/Button.jsx";
import { UsageCutoffDialog } from "@/components/feedback/UsageCutoffDialog";
import { saveReminder, saveSettings } from "../actions";
import { LocationCard } from "./LocationCard";

export function SettingsScreen({
  userId,
  name,
  email,
  initial,
  accent,
  streakReminder,
  showPreview,
  map,
  premium,
}: {
  userId: string;
  name: string;
  email: string;
  initial: string;
  accent: string;
  streakReminder: boolean;
  showPreview: boolean;
  map: { hasProfile: boolean; city: string | null; country: string | null; showOnMap: boolean };
  premium: boolean;
}) {
  const router = useRouter();
  const [profileName, setProfileName] = useState(name);
  const [reminder, setReminder] = useState(streakReminder);
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [cutoff, setCutoff] = useState(false);
  const shownInitial = profileName.trim().charAt(0).toUpperCase() || initial;
  const status = error || notice;

  async function save(label: string) {
    setPending(label);
    setNotice("");
    setError("");
    const result = await saveSettings({ name: profileName });
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice("Saved.");
    router.refresh();
  }

  return (
    <div className="sf-settings">
      <p className={status ? `sf-settings-banner${error ? " is-error" : ""}` : "sf-review-live"} aria-live="polite" role={error ? "alert" : "status"}>
        {status}
      </p>
      <SettingsSection
        title="Plan"
        subtitle={premium ? "This account includes Premium." : "You're on the free plan. Premium opens the other niches."}
      >
        {premium ? (
          <p className="sf-settings-note">
            The niches outside the thirty free paths are open, and this account can appear on the learner map.{" "}
            <Link href="/upgrade">Open the plan page</Link>
          </p>
        ) : (
          <>
            <ul className="sf-settings-plan">
              <li>Thirty paths, every stage, explain-back, and the certificate stay free.</li>
              <li>Premium opens the niches outside those paths, so you can follow them.</li>
              <li>Premium lets you appear on the learner map. The map itself stays free.</li>
            </ul>
            <p className="sf-settings-note">
              <Link href="/upgrade">See Premium</Link>
            </p>
          </>
        )}
      </SettingsSection>
      <SettingsSection title="Profile" subtitle="The name is what the app calls you. Email stays with the account.">
        <div className="sf-settings-profile">
          <div className="sf-settings-identity">
            <span className="sf-settings-avatar" aria-hidden="true">{shownInitial}</span>
            <div>
              <strong>{profileName.trim() || "Account"}</strong>
              <p>{email || "No email on this session."}</p>
              {userId ? (
                <p className="sf-settings-links">
                  <Link href="/creator">Creator studio</Link>
                  <Link href={`/profile/${userId}`}>Public profile</Link>
                </p>
              ) : null}
            </div>
          </div>
          <label className="sf-settings-fields">
            Name
            <input value={profileName} onChange={(event) => setProfileName(event.target.value)} autoComplete="name" />
          </label>
          <div className="sf-settings-bar">
            <Button type="button" variant="gradient" pending={pending === "profile"} pendingLabel="Saving…" onClick={() => void save("profile")}>
              Save profile
            </Button>
          </div>
        </div>
      </SettingsSection>
      <LocationCard map={map} canShare={premium} />
      <SettingsSection title="Notifications" subtitle="One reminder. No badges and no counts.">
        <SettingsToggle
          label="Daily streak reminder"
          description="A quiet note in the bell when yesterday counted and today has not."
          checked={reminder}
          onChange={(next) => {
            setReminder(next);
            setError("");
            void saveReminder(next).then((result) => {
              if (!result.ok) {
                setReminder(!next);
                setError(result.error);
              }
            });
          }}
        />
      </SettingsSection>
      <SettingsSection title="Appearance" subtitle="Theme and accent apply as soon as you choose them.">
        <div className="sf-settings-row">
          <div>
            <h3>Theme</h3>
            <p>Light or dark.</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="sf-settings-row sf-settings-accent">
          <div>
            <h3>Accent</h3>
            <p>A preset, including Spectrum, or your own gradient from the palette, a hex value, or RGB.</p>
          </div>
          <AccentPicker defaultAccent={accent} />
        </div>
      </SettingsSection>
      <SettingsSection title="Account">
        <div className="sf-settings-row">
          <div>
            <h3>Log out</h3>
            <p>Ends this session on this device.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void signOut({ callbackUrl: "/" })}>Log out</Button>
        </div>
      </SettingsSection>
      {showPreview ? (
        <SettingsSection title="Developer previews" subtitle="Hidden in production.">
          <div className="sf-settings-bar">
            <Button type="button" variant="outline" onClick={() => setCutoff(true)}>Open the usage cutoff</Button>
          </div>
        </SettingsSection>
      ) : null}
      <UsageCutoffDialog open={cutoff} onClose={() => setCutoff(false)} />
    </div>
  );
}
