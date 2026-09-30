"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AccentPicker } from "@/components/forms/AccentPicker.jsx";
import { SettingsSection } from "@/components/forms/SettingsSection.jsx";
import { SettingsToggle } from "@/components/forms/SettingsToggle.jsx";
import { ThemeToggle } from "@/components/forms/ThemeToggle.jsx";
import { Button } from "@/components/core/Button.jsx";
import { Chip } from "@/components/core/Chip.jsx";
import { UsageCutoffDialog } from "@/components/feedback/UsageCutoffDialog";
import { followSkill, saveSettings, unfollowSkill } from "../actions";
import type { SettingsSkill } from "@/lib/data/settings";

export function SettingsScreen({
  name,
  email,
  initial,
  skills,
  streakReminder,
  showPreview,
}: {
  name: string;
  email: string;
  initial: string;
  skills: SettingsSkill[];
  streakReminder: boolean;
  showPreview: boolean;
}) {
  const router = useRouter();
  const [profileName, setProfileName] = useState(name);
  const [reminder, setReminder] = useState(streakReminder);
  const [rows, setRows] = useState(skills);
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
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

  async function addSkill(id: string) {
    setPending(id);
    setNotice("");
    setError("");
    const result = await followSkill(id);
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRows((current) => current.map((skill) => (skill.id === id ? { ...skill, followed: true } : skill)));
    setNotice("Skill added. Your feed will use it on the next visit.");
    router.refresh();
  }

  async function removeSkill(id: string) {
    setPending(id);
    setNotice("");
    setError("");
    const result = await unfollowSkill(id);
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRows((current) => current.map((skill) => (skill.id === id ? { ...skill, followed: false } : skill)));
    setConfirmId(null);
    setNotice("Skill removed from the feed. Quiz and explain-back results stay on the account.");
    router.refresh();
  }

  return (
    <div className="sf-settings">
      <p className={status ? `sf-settings-banner${error ? " is-error" : ""}` : "sf-review-live"} aria-live="polite" role={error ? "alert" : "status"}>
        {status}
      </p>
      <SettingsSection title="Profile" subtitle="The name is what the app calls you. Email stays with the account.">
        <div className="sf-settings-profile">
          <div className="sf-settings-identity">
            <span className="sf-settings-avatar" aria-hidden="true">{shownInitial}</span>
            <div>
              <strong>{profileName.trim() || "Account"}</strong>
              <p>{email || "No email on this session."}</p>
            </div>
          </div>
          <label className="sf-settings-fields">
            Name
            <input value={profileName} onChange={(event) => setProfileName(event.target.value)} autoComplete="name" />
          </label>
          <div className="sf-settings-bar">
            <Button type="button" variant="gradient" disabled={pending === "profile"} onClick={() => void save("profile")}>
              {pending === "profile" ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </div>
      </SettingsSection>
      <SettingsSection title="Skills" subtitle="Add a skill to show it on Home. Removing one hides it from the feed. Quiz and explain-back results stay.">
        <ul className="sf-settings-skills">
          {rows.map((skill) => (
            <li key={skill.id}>
              <div className="sf-settings-skill">
                <strong>{skill.name}</strong>
                {skill.followed ? <Chip tone="accent">On your feed</Chip> : null}
                {skill.offer === "FREE" ? <Chip tone="pass">Free</Chip> : null}
                {skill.status === "coming_soon" ? <Chip tone="lock">Coming soon</Chip> : null}
              </div>
              {skill.followed ? (
                confirmId === skill.id ? (
                  <div className="sf-settings-skill-actions">
                    <p>Quiz results stay on the account.</p>
                    <Button type="button" size="sm" variant="outline" disabled={pending === skill.id} onClick={() => void removeSkill(skill.id)}>
                      {pending === skill.id ? "Removing..." : "Remove"}
                    </Button>
                    <Button type="button" size="sm" variant="quiet" onClick={() => setConfirmId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="sf-settings-skill-actions">
                    <Button type="button" size="sm" variant="quiet" onClick={() => setConfirmId(skill.id)}>Remove</Button>
                  </div>
                )
              ) : skill.status === "available" ? (
                <div className="sf-settings-skill-actions">
                  <Button type="button" size="sm" variant="outline" disabled={pending === skill.id} onClick={() => void addSkill(skill.id)}>
                    {pending === skill.id ? "Adding..." : "Add"}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </SettingsSection>
      <SettingsSection title="Notifications" subtitle="One reminder. No badges and no counts.">
        <SettingsToggle label="Daily streak reminder" description="A quiet note if the streak is still open." checked={reminder} onChange={setReminder} />
        <p className="sf-settings-note">This reminder stays on this screen. It is not stored on the account yet.</p>
      </SettingsSection>
      <SettingsSection title="Appearance" subtitle="Theme and accent apply as soon as you choose them.">
        <div className="sf-settings-row">
          <div>
            <h3>Theme</h3>
            <p>Light or dark.</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="sf-settings-row">
          <div>
            <h3>Accent</h3>
            <p>Color on buttons and highlights.</p>
          </div>
          <AccentPicker />
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
