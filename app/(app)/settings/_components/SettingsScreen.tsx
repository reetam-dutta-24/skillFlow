"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AccentPicker } from "@/components/forms/AccentPicker.jsx";
import { SettingsSection } from "@/components/forms/SettingsSection.jsx";
import { SettingsToggle } from "@/components/forms/SettingsToggle.jsx";
import { ThemeToggle } from "@/components/forms/ThemeToggle.jsx";
import { Button } from "@/components/core/Button.jsx";
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
      <p className="sf-review-live" aria-live="polite">{error || notice}</p>
      <SettingsSection title="Profile" subtitle="Email stays with the account.">
        <div className="sf-settings-profile">
          <span aria-hidden="true">{initial}</span>
          <label>
            Name
            <input value={profileName} onChange={(event) => setProfileName(event.target.value)} autoComplete="name" />
          </label>
          <p>Email: {email || "No email on this session."}</p>
          <Button type="button" variant="gradient" disabled={pending === "profile"} onClick={() => void save("profile")}>
            {pending === "profile" ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </SettingsSection>
      <SettingsSection title="Skills" subtitle="Removing a skill hides it from the feed. Quiz and explain-back results stay.">
        <ul className="sf-settings-skills">
          {rows.map((skill) => (
            <li key={skill.id}>
              <span>{skill.name}</span>
              {skill.status === "coming_soon" ? <em>Coming soon</em> : null}
              {skill.followed ? (
                confirmId === skill.id ? (
                  <span>
                    Quiz results stay.{" "}
                    <button type="button" disabled={pending === skill.id} onClick={() => void removeSkill(skill.id)}>
                      {pending === skill.id ? "Removing..." : "Remove"}
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)}>Cancel</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmId(skill.id)}>Remove</button>
                )
              ) : skill.status === "available" ? (
                <button type="button" disabled={pending === skill.id} onClick={() => void addSkill(skill.id)}>
                  {pending === skill.id ? "Adding..." : "Add"}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </SettingsSection>
      <SettingsSection title="Notifications" subtitle="One reminder. No badges and no counts.">
        <SettingsToggle label="Daily streak reminder" description="A quiet note if the streak is still open." checked={reminder} onChange={setReminder} />
        <Button
          type="button"
          variant="gradient"
          onClick={() => {
            setError("");
            setNotice("The daily reminder stays on this screen. It is not stored on the account yet.");
          }}
        >
          Save notifications
        </Button>
      </SettingsSection>
      <SettingsSection title="Appearance" subtitle="Theme and accent apply immediately.">
        <ThemeToggle />
        <AccentPicker />
      </SettingsSection>
      <SettingsSection title="Account">
        <Button type="button" variant="outline" onClick={() => void signOut({ callbackUrl: "/" })}>Log out</Button>
      </SettingsSection>
      {showPreview ? (
        <SettingsSection title="Developer previews" subtitle="Hidden in production.">
          <Button type="button" variant="outline" onClick={() => setCutoff(true)}>Open the usage cutoff</Button>
        </SettingsSection>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
      <UsageCutoffDialog open={cutoff} onClose={() => setCutoff(false)} />
    </div>
  );
}
