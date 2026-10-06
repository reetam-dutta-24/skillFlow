"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEADLINES,
  DEFAULT_PREFERENCES,
  GOALS,
  LEVELS,
  RESOURCE_KINDS,
  type DeadlineChoice,
  type LearningGoal,
  type LearnerLevel,
  type PlanPreferences,
  type ResourceKind,
} from "@/lib/plan/preferences";
import { readDescription, savePlan } from "../actions";

const LANGUAGES = [
  ["en", "English"],
  ["hi", "Hindi"],
  ["es", "Spanish"],
  ["fr", "French"],
  ["pt", "Portuguese"],
  ["de", "German"],
  ["ar", "Arabic"],
  ["zh", "Chinese"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
] as const;

const DEADLINE_LABEL: Record<DeadlineChoice, string> = {
  none: "No deadline",
  "1w": "1 week",
  "2w": "2 weeks",
  "1m": "1 month",
  "3m": "3 months",
  custom: "Custom",
};

export function PlanForm({ skillId, initial }: { skillId: string; initial: PlanPreferences | null }) {
  const router = useRouter();
  const start = initial ?? DEFAULT_PREFERENCES;
  const [level, setLevel] = useState<LearnerLevel>(start.level);
  const [minutesPerDay, setMinutesPerDay] = useState(String(start.minutesPerDay));
  const [daysPerWeek, setDaysPerWeek] = useState(String(start.daysPerWeek));
  const [deadline, setDeadline] = useState<DeadlineChoice>(start.deadline);
  const [customWeeks, setCustomWeeks] = useState(start.customWeeks ? String(start.customWeeks) : "");
  const [resourceTypes, setResourceTypes] = useState<ResourceKind[]>(start.resourceTypes);
  const [language, setLanguage] = useState(start.language);
  const [englishFallback, setEnglishFallback] = useState(start.englishFallback);
  const [goal, setGoal] = useState<LearningGoal>(start.goal);
  const [lowData, setLowData] = useState(start.lowData);
  const [captionsNeeded, setCaptionsNeeded] = useState(start.captionsNeeded);
  const [knownTopics, setKnownTopics] = useState(start.knownTopics.join(", "));
  const [description, setDescription] = useState("");
  const [understood, setUnderstood] = useState<PlanPreferences | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  function apply(next: PlanPreferences) {
    setLevel(next.level);
    setMinutesPerDay(String(next.minutesPerDay));
    setDaysPerWeek(String(next.daysPerWeek));
    setDeadline(next.deadline);
    setCustomWeeks(next.customWeeks ? String(next.customWeeks) : "");
    setResourceTypes(next.resourceTypes);
    setLanguage(next.language);
    setEnglishFallback(next.englishFallback);
    setGoal(next.goal);
    setLowData(next.lowData);
    setCaptionsNeeded(next.captionsNeeded);
    setKnownTopics(next.knownTopics.join(", "));
  }

  function toggleType(kind: ResourceKind) {
    setResourceTypes((current) => (current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind]));
  }

  async function onRead() {
    setBusy("read");
    setNotice("");
    const result = await readDescription(description);
    setBusy("");
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setUnderstood(result.preferences);
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const languageLabel = LANGUAGES.find((item) => item[0] === language)?.[1] ?? language;
    const payload: PlanPreferences = {
      level,
      minutesPerDay: Number(minutesPerDay),
      daysPerWeek: Number(daysPerWeek),
      deadline,
      customWeeks: deadline === "custom" ? Number(customWeeks) : null,
      resourceTypes,
      language,
      languageLabel,
      englishFallback,
      goal,
      lowData,
      captionsNeeded,
      knownTopics: knownTopics.split(",").map((topic) => topic.trim()).filter(Boolean).slice(0, 12),
    };
    setBusy("save");
    setNotice("");
    const result = await savePlan(skillId, payload);
    setBusy("");
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    router.push(`/roadmap/${result.slug}`);
    router.refresh();
  }

  return (
    <form className="sf-plan-form" onSubmit={onSave}>
      <label>
        Describe how you like to learn
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={4} placeholder="Short Hindi videos, about 20 minutes a day, I already know exposure." />
      </label>
      <button type="button" onClick={() => void onRead()} disabled={busy === "read"}>
        {busy === "read" ? "Reading" : "Read this"}
      </button>
      {understood ? (
        <div className="sf-note-summary">
          <p>
            Understood as {understood.level}, {understood.languageLabel}, {understood.resourceTypes.join(" then ")}, {understood.minutesPerDay} min/day, {understood.daysPerWeek} days a week, goal {understood.goal}.
          </p>
          <button type="button" onClick={() => apply(understood)}>Use these choices</button>
        </div>
      ) : null}
      <label>
        Level
        <select value={level} onChange={(event) => setLevel(event.target.value as LearnerLevel)}>
          {LEVELS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        Minutes per day
        <input value={minutesPerDay} onChange={(event) => setMinutesPerDay(event.target.value)} inputMode="numeric" min={10} max={240} required />
      </label>
      <label>
        Days per week
        <input value={daysPerWeek} onChange={(event) => setDaysPerWeek(event.target.value)} inputMode="numeric" min={1} max={7} required />
      </label>
      <label>
        Deadline
        <select value={deadline} onChange={(event) => setDeadline(event.target.value as DeadlineChoice)}>
          {DEADLINES.map((item) => (
            <option key={item} value={item}>{DEADLINE_LABEL[item]}</option>
          ))}
        </select>
      </label>
      {deadline === "custom" ? (
        <label>
          Weeks
          <input value={customWeeks} onChange={(event) => setCustomWeeks(event.target.value)} inputMode="numeric" min={1} max={104} required />
        </label>
      ) : null}
      <fieldset>
        <legend>Resource types, in the order you prefer</legend>
        <div className="sf-plan-checks">
          {RESOURCE_KINDS.map((kind) => (
            <label key={kind}>
              <input type="checkbox" checked={resourceTypes.includes(kind)} onChange={() => toggleType(kind)} />
              {kind}
              {resourceTypes.includes(kind) ? <span> {resourceTypes.indexOf(kind) + 1}</span> : null}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        Language
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          {LANGUAGES.map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </label>
      <label className="sf-plan-check">
        <input type="checkbox" checked={englishFallback} onChange={(event) => setEnglishFallback(event.target.checked)} />
        English is ok as a fallback
      </label>
      <label>
        Goal
        <select value={goal} onChange={(event) => setGoal(event.target.value as LearningGoal)}>
          {GOALS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="sf-plan-check">
        <input type="checkbox" checked={lowData} onChange={(event) => setLowData(event.target.checked)} />
        Low data mode
      </label>
      <label className="sf-plan-check">
        <input type="checkbox" checked={captionsNeeded} onChange={(event) => setCaptionsNeeded(event.target.checked)} />
        Captions needed
      </label>
      <label>
        Topics I already know
        <input value={knownTopics} onChange={(event) => setKnownTopics(event.target.value)} placeholder="exposure, lighting" />
      </label>
      <button type="submit" disabled={busy === "save" || resourceTypes.length === 0}>
        {busy === "save" ? "Saving" : "Save plan"}
      </button>
      {notice ? <p className="sf-note-summary" role="alert">{notice}</p> : null}
    </form>
  );
}
