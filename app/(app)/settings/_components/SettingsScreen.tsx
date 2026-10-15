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
import { ProfilePhotoPicker, photoPreview } from "@/components/forms/ProfilePhotoPicker";
import { MAX_DISPLAY_NAME, type PhotoChoice } from "@/lib/profile-identity";
import { UsageCutoffDialog } from "@/components/feedback/UsageCutoffDialog";
import { saveNotificationPref, saveSettings, saveShowActivity, saveShowDetox } from "../actions";
import { DangerZone } from "./DangerZone";
import { LocationCard } from "./LocationCard";
import { SignInCard, type SignInState } from "./SignInCard";

type NoteKind = "streak" | "reviews" | "community" | "detox";

const NOTE_ROWS: { kind: NoteKind; label: string; description: string }[] = [
  {
    kind: "reviews",
    label: "Review results",
    description: "When a suggested resource, an Open Source contribution, a creator video, or an event you sent is decided.",
  },
  {
    kind: "community",
    label: "Questions and answers",
    description: "When someone asks about your published post, or the author answers your question.",
  },
  {
    kind: "streak",
    label: "Daily streak reminder",
    description: "A note in the bell when yesterday counted and today has not yet.",
  },
  {
    kind: "detox",
    label: "Weekly Detox check-in",
    description: "Once a week after your Detox self-check: one minute for your screen time and focus.",
  },
];

export function SettingsScreen({
  userId,
  name,
  image,
  email,
  initial,
  accent,
  notifications,
  showActivity,
  showDetox,
  showPreview,
  map,
  premium,
  signIn,
}: {
  userId: string;
  name: string;
  image: string | null;
  email: string;
  initial: string;
  accent: string;
  streakReminder: boolean;
  notifications: { prefs: Record<NoteKind, boolean>; unread: Record<NoteKind, number> };
  showActivity: boolean;
  showDetox: boolean;
  showPreview: boolean;
  map: { hasProfile: boolean; city: string | null; country: string | null; showOnMap: boolean };
  premium: boolean;
  signIn: SignInState;
}) {
  const router = useRouter();
  const [profileName, setProfileName] = useState(name);
  const [photo, setPhoto] = useState<PhotoChoice>({ kind: "keep" });
  const [photoBusy, setPhotoBusy] = useState(false);
  const shownPhoto = photoPreview(photo, image);
  const [prefs, setPrefs] = useState(notifications.prefs);
  const [activity, setActivity] = useState(showActivity);
  const [detox, setDetox] = useState(showDetox);
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [cutoff, setCutoff] = useState(false);
  const shownInitial = profileName.trim().charAt(0).toUpperCase() || initial;
  const unreadTotal = NOTE_ROWS.reduce((sum, row) => sum + (prefs[row.kind] ? notifications.unread[row.kind] : 0), 0);
  const status = error || notice;

  async function save(label: string) {
    setPending(label);
    setNotice("");
    setError("");
    const result = await saveSettings({ name: profileName, photo });
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice("Saved.");
    setPhoto({ kind: "keep" });
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
      <SettingsSection title="Profile" subtitle="Your display name and photo are what other learners see. Email stays private.">
        <div className="sf-settings-profile">
          <div className="sf-settings-identity">
            <span className="sf-settings-avatar" aria-hidden="true">
              {shownPhoto ? (
                // An upload, a Google photo, or a generated avatar preview.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownPhoto} alt="" width={56} height={56} decoding="async" />
              ) : (
                shownInitial
              )}
            </span>
            <div>
              <strong>{profileName.trim() || "Account"}</strong>
              <p>{email || "No email on this session."}</p>
              {userId ? (
                <p className="sf-settings-links">
                  <Link href="/creator">Creator studio</Link>
                  <Link href={`/profile/${userId}`}>Public profile</Link>
                  <Link href="/onboarding?edit=1">Edit profile answers</Link>
                  <Link href="/career-test">Career-fit test</Link>
                </p>
              ) : null}
            </div>
          </div>
          <label className="sf-settings-fields">
            Display name
            <input value={profileName} maxLength={MAX_DISPLAY_NAME} onChange={(event) => setProfileName(event.target.value)} autoComplete="nickname" />
          </label>
          <div className="sf-settings-fields">
            <span>Profile photo</span>
            <ProfilePhotoPicker name={profileName} current={image} value={photo} onChange={setPhoto} onBusy={setPhotoBusy} />
          </div>
          <div className="sf-settings-bar">
            <Button type="button" variant="gradient" pending={pending === "profile"} pendingLabel="Saving…" disabled={photoBusy} onClick={() => void save("profile")}>
              Save profile
            </Button>
          </div>
        </div>
      </SettingsSection>
      <SignInCard email={email} signIn={signIn} />
      <LocationCard map={map} canShare={premium} />
      <SettingsSection
        id="notifications"
        title="Notifications"
        subtitle={
          unreadTotal > 0
            ? `${unreadTotal} new in the bell right now. The number on the bell counts what is switched on here.`
            : "Nothing new in the bell. The number on the bell counts what is switched on here."
        }
      >
        {NOTE_ROWS.map((row) => (
          <SettingsToggle
            key={row.kind}
            label={
              <span className="sf-note-pref">
                {row.label}
                <span className="sf-note-pref-count" data-zero={notifications.unread[row.kind] === 0 ? "true" : undefined}>
                  {notifications.unread[row.kind]} new
                </span>
              </span>
            }
            description={row.description}
            checked={prefs[row.kind]}
            onChange={(next: boolean) => {
              setPrefs((current) => ({ ...current, [row.kind]: next }));
              setError("");
              void saveNotificationPref(row.kind, next).then((result) => {
                if (!result.ok) {
                  setPrefs((current) => ({ ...current, [row.kind]: !next }));
                  setError(result.error);
                } else {
                  router.refresh();
                }
              });
            }}
          />
        ))}
      </SettingsSection>
      <SettingsSection title="Profile visibility" subtitle="Your public profile is seen by signed-in learners.">
        <SettingsToggle
          label="Show my activity on my profile"
          description="The contribution heatmap and learning totals: counts only, never your answers or notes. You always see them yourself."
          checked={activity}
          onChange={(next) => {
            setActivity(next);
            setError("");
            void saveShowActivity(next).then((result) => {
              if (!result.ok) {
                setActivity(!next);
                setError(result.error);
              }
            });
          }}
        />
        <SettingsToggle
          label="Show my Detox Score on my profile"
          description="Only the score and its band, never your answers, check-ins, or focus sessions. Off unless you turn it on."
          checked={detox}
          onChange={(next) => {
            setDetox(next);
            setError("");
            void saveShowDetox(next).then((result) => {
              if (!result.ok) {
                setDetox(!next);
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
      <DangerZone email={email} hasPassword={signIn.hasPassword} />
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
