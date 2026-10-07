"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardCard } from "@/components/forms/WizardCard";
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

const STEPS = ["describe", "level", "pace", "deadline", "resources", "language", "review"] as const;

export function PlanForm({ skillId, initial }: { skillId: string; initial: PlanPreferences | null }) {
  const router = useRouter();
  const start = initial ?? DEFAULT_PREFERENCES;
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
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

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setNotice("");
  }

  function payload(): PlanPreferences | null {
    const minutes = Number(minutesPerDay);
    const days = Number(daysPerWeek);
    const weeks = deadline === "custom" ? Number(customWeeks) : null;
    if (!Number.isInteger(minutes) || minutes < 10 || minutes > 240) return null;
    if (!Number.isInteger(days) || days < 1 || days > 7) return null;
    if (deadline === "custom" && (!Number.isInteger(weeks) || (weeks ?? 0) < 1 || (weeks ?? 0) > 104)) return null;
    if (resourceTypes.length === 0) return null;
    const languageLabel = LANGUAGES.find((item) => item[0] === language)?.[1] ?? language;
    return {
      level,
      minutesPerDay: minutes,
      daysPerWeek: days,
      deadline,
      customWeeks: weeks,
      resourceTypes,
      language,
      languageLabel,
      englishFallback,
      goal,
      lowData,
      captionsNeeded,
      knownTopics: knownTopics.split(",").map((topic) => topic.trim()).filter(Boolean).slice(0, 12),
      applied: true,
    };
  }

  function continueStep() {
    if (step === 2) {
      const minutes = Number(minutesPerDay);
      const days = Number(daysPerWeek);
      if (!Number.isInteger(minutes) || minutes < 10 || minutes > 240) {
        setNotice("Minutes per day need to be a whole number from 10 to 240.");
        return;
      }
      if (!Number.isInteger(days) || days < 1 || days > 7) {
        setNotice("Days per week need to be a whole number from 1 to 7.");
        return;
      }
    }
    if (step === 3 && deadline === "custom") {
      const weeks = Number(customWeeks);
      if (!Number.isInteger(weeks) || weeks < 1 || weeks > 104) {
        setNotice("Add a number of weeks, from 1 to 104.");
        return;
      }
    }
    if (step === 4 && resourceTypes.length === 0) {
      setNotice("Choose at least one kind of resource.");
      return;
    }
    go(step + 1);
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

  async function onSave() {
    if (busy) return;
    const next = payload();
    if (!next) {
      setNotice("Check the pace, the deadline, and the resource types.");
      return;
    }
    setBusy("save");
    setNotice("");
    const result = await savePlan(skillId, next);
    setBusy("");
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    router.push(`/roadmap/${result.slug}`);
    router.refresh();
  }

  const titles = [
    "How do you like to learn?",
    "Where are you starting?",
    "How much time?",
    "Is there a deadline?",
    "Which resources first?",
    "Language and goal",
    "Save this plan",
  ];

  return (
    <WizardCard
      step={step}
      total={STEPS.length}
      title={titles[step] ?? "Plan"}
      direction={direction}
      onStep={go}
      onBack={() => go(step - 1)}
      onNext={step === STEPS.length - 1 ? () => void onSave() : continueStep}
      nextLabel={step === STEPS.length - 1 ? "Save plan" : "Continue"}
      pending={busy === "save"}
      error={notice}
    >
      {step === 0 ? (
        <>
          <label>
            Describe it, if you want
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={4} placeholder="Short Hindi videos, about 20 minutes a day, I already know exposure." />
          </label>
          <button type="button" className="sf-path-cta" onClick={() => void onRead()} disabled={busy === "read" || description.trim().length < 8}>
            {busy === "read" ? "Reading…" : "Turn this into choices"}
          </button>
          {understood ? (
            <div className="sf-note-summary">
              <p>
                Understood as {understood.level}, {understood.languageLabel}, {understood.resourceTypes.join(" then ")}, {understood.minutesPerDay} min/day, {understood.daysPerWeek} days a week, goal {understood.goal}.
              </p>
              <button type="button" onClick={() => apply(understood)}>Use these choices</button>
            </div>
          ) : (
            <p className="sf-fill-hint">You can skip this and choose each part yourself.</p>
          )}
        </>
      ) : null}
      {step === 1 ? (
        <div className="sf-pick-grid">
          {LEVELS.map((item) => (
            <button key={item} type="button" className={level === item ? "sf-pick is-on" : "sf-pick"} onClick={() => setLevel(item)}>
              <span className="sf-pick-label">{item}</span>
            </button>
          ))}
        </div>
      ) : null}
      {step === 2 ? (
        <>
          <label>
            Minutes per day
            <input value={minutesPerDay} onChange={(event) => setMinutesPerDay(event.target.value)} inputMode="numeric" min={10} max={240} />
          </label>
          <label>
            Days per week
            <input value={daysPerWeek} onChange={(event) => setDaysPerWeek(event.target.value)} inputMode="numeric" min={1} max={7} />
          </label>
        </>
      ) : null}
      {step === 3 ? (
        <>
          <div className="sf-pick-grid">
            {DEADLINES.map((item) => (
              <button key={item} type="button" className={deadline === item ? "sf-pick is-on" : "sf-pick"} onClick={() => setDeadline(item)}>
                <span className="sf-pick-label">{DEADLINE_LABEL[item]}</span>
              </button>
            ))}
          </div>
          {deadline === "custom" ? (
            <label>
              Weeks
              <input value={customWeeks} onChange={(event) => setCustomWeeks(event.target.value)} inputMode="numeric" min={1} max={104} />
            </label>
          ) : null}
        </>
      ) : null}
      {step === 4 ? (
        <fieldset>
          <legend>In the order you prefer</legend>
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
      ) : null}
      {step === 5 ? (
        <>
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
        </>
      ) : null}
      {step === 6 ? (
        <ul className="sf-fill-summary">
          <li>{level}, {minutesPerDay} minutes a day, {daysPerWeek} days a week</li>
          <li>{DEADLINE_LABEL[deadline]}{deadline === "custom" ? `, ${customWeeks} weeks` : ""}</li>
          <li>{resourceTypes.join(" then ") || "No resource type yet"}</li>
          <li>{LANGUAGES.find((item) => item[0] === language)?.[1] ?? language}{englishFallback ? ", English is ok" : ""}</li>
          <li>Goal: {goal}{lowData ? ", low data" : ""}{captionsNeeded ? ", captions" : ""}</li>
        </ul>
      ) : null}
    </WizardCard>
  );
}
