"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SkillImage } from "@/components/core/SkillImage";
import { customThemeVars, parseCustomAccent } from "@/lib/accent-color";
import { ACCENTS, applyStoredAccent, isAccentId, isStoredAccent } from "@/lib/accent";
import { CustomAccentForm } from "@/components/forms/CustomAccentForm.jsx";
import { PACE_CHOICES, SKILL_CHOICES, paceById } from "@/lib/learner";
import {
  AGE_RANGES,
  EXPERIENCE,
  FORMATS,
  GOALS,
  LANGUAGES,
  MAX_HEADLINE,
  MAX_PATHS,
  STAGES,
  WEEKLY_HOURS,
  labelOf,
} from "@/lib/onboarding-options";
import { saveLearnerProfile } from "@/app/onboarding/actions";
import { saveMapCity, searchMapCities } from "@/app/(app)/settings/location-actions";
import { ThemeToggle } from "../forms/ThemeToggle.jsx";
import { Button } from "../core/Button.jsx";
import { Icon } from "../core/Icon.jsx";
import { PaginationDots } from "../navigation/PaginationDots.jsx";

const STEPS = ["about", "city", "paths", "goals", "time", "accent", "ready"];
const TITLES = {
  about: "A little about you",
  city: "Where are you?",
  paths: "Pick your paths",
  goals: "What do you want from it?",
  time: "How you like to learn",
  accent: "Your color",
  ready: "You're set",
};
const EASE = [0.22, 1, 0.36, 1];
const WELCOME_MS = 2800;

function toggle(list, id, max = Infinity) {
  if (list.includes(id)) return list.filter((item) => item !== id);
  return list.length >= max ? list : [...list, id];
}

/**
 * Onboarding profile, seven short steps. Lists that can hold several answers (paths, goals, formats,
 * languages) are multi-select; age, stage, experience, pace, and time are one answer each.
 * The career-fit test is not here: Home offers it after onboarding.
 *
 * @param {{ name?: string, paths: { slug: string, name: string, image: string, group: string, description: string }[], editing?: boolean, initial?: any }} props
 */
export function OnboardingWizard({ name = "", paths, editing = false, initial = null }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const titleRef = useRef(null);
  const [phase, setPhase] = useState(editing ? "wizard" : "welcome");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [ageRange, setAgeRange] = useState(initial?.ageRange ?? "");
  const [consent, setConsent] = useState(Boolean(initial?.guardianConsent));
  const [stage, setStage] = useState(initial?.stage ?? "");
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [city, setCity] = useState(null);
  const [chosenPaths, setChosenPaths] = useState(initial?.paths ?? []);
  const [goals, setGoals] = useState(initial?.goals ?? []);
  const [experience, setExperience] = useState(initial?.experience ?? "");
  const [pace, setPace] = useState(initial?.pace && PACE_CHOICES.some((item) => item.id === initial.pace) ? initial.pace : "");
  const [weeklyHours, setWeeklyHours] = useState(initial?.weeklyHours ?? 0);
  const [formats, setFormats] = useState(initial?.formats ?? []);
  const [languages, setLanguages] = useState(initial?.languages?.length ? initial.languages : ["en"]);
  const [accent, setAccent] = useState(isStoredAccent(initial?.accent) ? initial.accent : "dusk");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isStoredAccent(accent)) applyStoredAccent(accent);
  }, [accent]);

  // With reduced motion the welcome card is skipped outright, so nothing waits on a timer.
  const welcoming = phase === "welcome" && !reduce;

  useEffect(() => {
    if (!welcoming) return;
    const id = window.setTimeout(() => setPhase("wizard"), WELCOME_MS);
    return () => window.clearTimeout(id);
  }, [welcoming]);

  useEffect(() => {
    if (welcoming) return;
    titleRef.current?.focus();
  }, [step, welcoming]);

  const key = STEPS[step];
  const ready = key === "ready";
  const canContinue =
    (key === "about" && Boolean(ageRange) && ageRange !== "under-13" && (ageRange !== "13-17" || consent) && Boolean(stage)) ||
    key === "city" ||
    (key === "paths" && chosenPaths.length > 0) ||
    (key === "goals" && goals.length > 0 && Boolean(experience)) ||
    (key === "time" && Boolean(pace) && Boolean(weeklyHours) && formats.length > 0 && languages.length > 0) ||
    key === "accent" ||
    ready;

  function go(next) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError(null);
  }

  async function finish() {
    setPending(true);
    setError(null);
    try {
      await save();
    } catch {
      setError("Your profile could not be saved. Try again.");
      setPending(false);
    }
  }

  async function save() {
    const result = await saveLearnerProfile({
      ageRange,
      guardianConsent: consent,
      stage,
      headline,
      paths: chosenPaths,
      goals,
      experience,
      pace,
      weeklyHours,
      formats,
      languages,
      accent,
    });
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    if (city) {
      const saved = await saveMapCity({ city: city.city, country: city.country, lat: city.lat, lng: city.lng });
      if (!saved.ok) {
        // The profile is saved; only the city failed. Say so, and let them carry on.
        setError(`${saved.error} Your profile is saved. You can add the city later in Settings.`);
        setPending(false);
        return;
      }
    }
    router.push("/dashboard");
    router.refresh();
  }

  const motionProps = reduce
    ? { initial: false, animate: { opacity: 1, x: 0 }, exit: { opacity: 1, x: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, x: direction * 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -24 },
        transition: { duration: 0.34, ease: EASE },
      };

  const handoff = reduce
    ? { initial: false, animate: { opacity: 1, y: 0 }, exit: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 36 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -48 },
        transition: { duration: 0.55, ease: EASE },
      };

  const pathBySlug = useMemo(() => new Map(paths.map((path) => [path.slug, path])), [paths]);

  return (
    <div className="sf-wizard">
      <div className="sf-wizard-bar">
        <Link className="sf-wordmark" href="/">
          SkillFlow
        </Link>
        <ThemeToggle quiet />
      </div>
      <div className="sf-wizard-slot">
        <AnimatePresence mode="wait">
          {welcoming ? (
            <WelcomeCard key="welcome" name={name} reduce={reduce} motionProps={handoff} />
          ) : (
            <motion.div key="wizard" className="sf-wizard-card sf-onboard-card" {...handoff}>
              <div className="sf-wizard-track" aria-hidden="true">
                <motion.span
                  className="sf-wizard-fill"
                  initial={false}
                  animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  transition={reduce ? { duration: 0 } : { duration: 0.35, ease: EASE }}
                />
              </div>
              <PaginationDots total={STEPS.length} current={step} onChange={(index) => index < step && go(index)} />
              <div className="sf-wizard-stage">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={key} className="sf-wizard-step" {...motionProps}>
                    <p className="sf-onboard-count">
                      Step {step + 1} of {STEPS.length}
                    </p>
                    <h1 ref={titleRef} tabIndex={-1}>
                      {TITLES[key]}
                    </h1>
                    {key === "about" ? (
                      <AboutStep
                        ageRange={ageRange}
                        setAgeRange={setAgeRange}
                        consent={consent}
                        setConsent={setConsent}
                        stage={stage}
                        setStage={setStage}
                        headline={headline}
                        setHeadline={setHeadline}
                        reduce={reduce}
                      />
                    ) : null}
                    {key === "city" ? <CityStep picked={city} onPick={setCity} saved={initial?.city ?? ""} /> : null}
                    {key === "paths" ? <PathsStep paths={paths} value={chosenPaths} onChange={setChosenPaths} reduce={reduce} /> : null}
                    {key === "goals" ? (
                      <GoalsStep goals={goals} setGoals={setGoals} experience={experience} setExperience={setExperience} reduce={reduce} />
                    ) : null}
                    {key === "time" ? (
                      <TimeStep
                        pace={pace}
                        setPace={setPace}
                        weeklyHours={weeklyHours}
                        setWeeklyHours={setWeeklyHours}
                        formats={formats}
                        setFormats={setFormats}
                        languages={languages}
                        setLanguages={setLanguages}
                        reduce={reduce}
                      />
                    ) : null}
                    {key === "accent" ? <AccentStep value={accent} onChange={setAccent} reduce={reduce} /> : null}
                    {ready ? (
                      <ReadyStep
                        name={name}
                        paths={chosenPaths.map((slug) => pathBySlug.get(slug)).filter(Boolean)}
                        stage={stage}
                        goals={goals}
                        pace={pace}
                        weeklyHours={weeklyHours}
                        city={city ? city.label : initial?.city ?? ""}
                        accent={accent}
                      />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>
              {error ? (
                <p className="sf-auth-error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="sf-wizard-nav">
                <Button type="button" variant="ghost" disabled={step === 0 || pending} onClick={() => go(step - 1)}>
                  Back
                </Button>
                <Button
                  type="button"
                  variant="gradient"
                  size="lg"
                  disabled={!canContinue}
                  pending={pending}
                  pendingLabel="Saving…"
                  onClick={ready ? finish : () => go(step + 1)}
                >
                  {ready ? (editing ? "Save my profile" : "Open my dashboard") : key === "city" && !city ? "Skip for now" : "Continue"}
                </Button>
              </div>
              <p className="sf-wizard-live" aria-live="polite">
                Step {step + 1} of {STEPS.length}. {TITLES[key]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WelcomeCard({ name, reduce, motionProps }) {
  const first = name.trim().split(/\s+/)[0];
  return (
    <motion.div className="sf-wizard-card sf-welcome" role="status" {...motionProps}>
      <div className="sf-welcome-photos" aria-hidden="true">
        {SKILL_CHOICES.map((skill, index) => (
          <motion.span
            key={skill.slug}
            className="sf-welcome-photo"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, rotate: (index - 2) * 7 }}
            transition={reduce ? { duration: 0 } : { duration: 0.45, delay: 0.08 + index * 0.06, ease: EASE }}
            style={{ zIndex: index }}
          >
            <SkillImage src={skill.image} alt="" fill sizes="72px" />
          </motion.span>
        ))}
      </div>
      <h1>{first ? `Welcome, ${first}` : "Welcome"}</h1>
      <p>Seven short steps, then your dashboard.</p>
      <div className="sf-welcome-timer" aria-hidden="true">
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={reduce ? { duration: 0 } : { duration: WELCOME_MS / 1000, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

function Field({ label, hint, children, id }) {
  return (
    <fieldset className="sf-onboard-field" aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend>{label}</legend>
      {hint ? (
        <p className="sf-onboard-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {children}
    </fieldset>
  );
}

function AboutStep({ ageRange, setAgeRange, consent, setConsent, stage, setStage, headline, setHeadline, reduce }) {
  return (
    <div className="sf-onboard-stack">
      <Field label="Your age" id="age">
        <div className="sf-chip-grid">
          {AGE_RANGES.map((option) => (
            <ChipPick key={option.id} selected={ageRange === option.id} onClick={() => setAgeRange(option.id)}>
              {option.label}
            </ChipPick>
          ))}
        </div>
        {ageRange === "under-13" ? (
          <p className="sf-onboard-warn" role="alert">
            SkillFlow is for people 13 and older. Come back when you are 13.
          </p>
        ) : null}
        {ageRange === "13-17" ? (
          <label className="sf-onboard-consent">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>
              A parent or guardian has read the <a href="/terms" target="_blank" rel="noreferrer">Terms</a> and{" "}
              <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> and agrees that I use SkillFlow.
            </span>
          </label>
        ) : null}
      </Field>
      <Field label="What are you doing right now?" id="stage">
        <div className="sf-pick-grid sf-pick-compact">
          {STAGES.map((option, index) => (
            <Pick key={option.id} selected={stage === option.id} onClick={() => setStage(option.id)} reduce={reduce} delay={index}>
              <span className="sf-pick-icon">
                <Icon name={option.icon} size={20} />
              </span>
              <span className="sf-pick-label">{option.label}</span>
            </Pick>
          ))}
        </div>
      </Field>
      <label className="sf-onboard-text">
        <span>
          A one-line headline <em>(optional)</em>
        </span>
        <input
          value={headline}
          maxLength={MAX_HEADLINE}
          onChange={(event) => setHeadline(event.target.value)}
          placeholder="Second-year student learning to ship web apps"
        />
        <small>Shown on your public profile. {MAX_HEADLINE - headline.length} characters left.</small>
      </label>
    </div>
  );
}

function CityStep({ picked, onPick, saved }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef(null);

  function onQuery(value) {
    setQuery(value);
    setError("");
    if (timer.current) window.clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setHits([]);
      return;
    }
    timer.current = window.setTimeout(async () => {
      setSearching(true);
      const result = await searchMapCities(value.trim());
      setSearching(false);
      if (!result.ok) {
        setError(result.error);
        setHits([]);
        return;
      }
      setHits(result.cities);
    }, 400);
  }

  return (
    <div className="sf-onboard-stack">
      <p className="sf-onboard-lede">
        Optional. Nearby events open on this city. We store the city, the country, and the city centre, never your device&apos;s location.
      </p>
      {saved && !picked ? (
        <p className="sf-onboard-saved">
          <Icon name="map-pin" size={15} /> Saved: <strong>{saved}</strong>
        </p>
      ) : null}
      <label className="sf-onboard-text">
        <span>Search for your city</span>
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Pune, Lisbon, Toronto…" autoComplete="off" />
      </label>
      {searching ? <p className="sf-onboard-hint">Searching…</p> : null}
      {error ? (
        <p className="sf-onboard-warn" role="alert">
          {error}
        </p>
      ) : null}
      {hits.length > 0 ? (
        <ul className="sf-onboard-cities" role="listbox" aria-label="Matching cities">
          {hits.map((hit) => {
            const selected = picked?.label === hit.label;
            return (
              <li key={hit.label}>
                <button type="button" role="option" aria-selected={selected} className={selected ? "is-on" : undefined} onClick={() => onPick(hit)}>
                  <Icon name="map-pin" size={15} />
                  {hit.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {picked ? (
        <p className="sf-onboard-saved">
          <Icon name="check" size={15} /> <strong>{picked.label}</strong>
          <button type="button" className="sf-onboard-link" onClick={() => onPick(null)}>
            Clear
          </button>
        </p>
      ) : null}
    </div>
  );
}

function PathsStep({ paths, value, onChange, reduce }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const groups = useMemo(() => ["all", ...new Set(paths.map((path) => path.group))], [paths]);
  const needle = query.trim().toLowerCase();
  const visible = paths.filter(
    (path) =>
      (group === "all" || path.group === group) &&
      (!needle || `${path.name} ${path.description}`.toLowerCase().includes(needle)),
  );
  const full = value.length >= MAX_PATHS;

  return (
    <div className="sf-onboard-stack">
      <p className="sf-onboard-lede">
        All thirty are free, every stage included. Pick up to {MAX_PATHS}; you can follow more later from Niches.
      </p>
      <div className="sf-onboard-pathtools">
        <label className="sf-onboard-search">
          <Icon name="search" size={16} />
          <span className="sf-sr">Search paths</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a path" />
        </label>
        <div className="sf-chip-grid" role="group" aria-label="Filter by group">
          {groups.map((item) => (
            <ChipPick key={item} selected={group === item} onClick={() => setGroup(item)}>
              {item === "all" ? "All" : item.charAt(0).toUpperCase() + item.slice(1)}
            </ChipPick>
          ))}
        </div>
      </div>
      <p className="sf-onboard-hint" aria-live="polite">
        {value.length} of {MAX_PATHS} chosen{full ? ". Remove one to pick another." : "."}
      </p>
      <div className="sf-pick-grid sf-pick-skills sf-onboard-paths">
        {visible.map((path, index) => {
          const selected = value.includes(path.slug);
          return (
            <Pick
              key={path.slug}
              selected={selected}
              disabled={!selected && full}
              onClick={() => onChange((current) => toggle(current, path.slug, MAX_PATHS))}
              reduce={reduce}
              delay={Math.min(index, 8)}
            >
              <span className="sf-pick-photo">
                <SkillImage src={path.image} alt="" fill sizes="(min-width: 720px) 180px, 42vw" />
              </span>
              <span className="sf-pick-label">{path.name}</span>
            </Pick>
          );
        })}
        {visible.length === 0 ? <p className="sf-onboard-hint">No path matches. Try another word.</p> : null}
      </div>
    </div>
  );
}

function GoalsStep({ goals, setGoals, experience, setExperience, reduce }) {
  return (
    <div className="sf-onboard-stack">
      <Field label="Your goals" hint="Choose all that apply." id="goals">
        <div className="sf-pick-grid sf-pick-compact">
          {GOALS.map((option, index) => (
            <Pick key={option.id} selected={goals.includes(option.id)} onClick={() => setGoals((current) => toggle(current, option.id))} reduce={reduce} delay={index}>
              <span className="sf-pick-icon">
                <Icon name={option.icon} size={20} />
              </span>
              <span className="sf-pick-label">{option.label}</span>
            </Pick>
          ))}
        </div>
      </Field>
      <Field label="Your experience with these paths" id="experience">
        <div className="sf-pick-grid sf-pick-compact">
          {EXPERIENCE.map((option, index) => (
            <Pick key={option.id} selected={experience === option.id} onClick={() => setExperience(option.id)} reduce={reduce} delay={index}>
              <span className="sf-pick-label">{option.label}</span>
              <span className="sf-pick-hint">{option.hint}</span>
            </Pick>
          ))}
        </div>
      </Field>
    </div>
  );
}

function TimeStep({ pace, setPace, weeklyHours, setWeeklyHours, formats, setFormats, languages, setLanguages, reduce }) {
  return (
    <div className="sf-onboard-stack">
      <Field label="Your pace" id="pace">
        <div className="sf-pick-grid sf-pick-compact">
          {PACE_CHOICES.map((option, index) => (
            <Pick key={option.id} selected={pace === option.id} onClick={() => setPace(option.id)} reduce={reduce} delay={index}>
              <span className="sf-pick-icon">
                <Icon name={option.icon} size={20} />
              </span>
              <span className="sf-pick-label">{option.label}</span>
              <span className="sf-pick-hint">{option.hint}</span>
            </Pick>
          ))}
        </div>
      </Field>
      <Field label="Time you can give" id="hours">
        <div className="sf-chip-grid">
          {WEEKLY_HOURS.map((option) => (
            <ChipPick key={option.id} selected={weeklyHours === option.id} onClick={() => setWeeklyHours(option.id)}>
              {option.label}
            </ChipPick>
          ))}
        </div>
      </Field>
      <Field label="How you like to learn" hint="Choose all that apply." id="formats">
        <div className="sf-chip-grid">
          {FORMATS.map((option) => (
            <ChipPick key={option.id} selected={formats.includes(option.id)} onClick={() => setFormats((current) => toggle(current, option.id))} icon={option.icon}>
              {option.label}
            </ChipPick>
          ))}
        </div>
      </Field>
      <Field label="Languages you learn in" hint="Choose all that apply." id="languages">
        <div className="sf-chip-grid">
          {LANGUAGES.map((option) => (
            <ChipPick key={option.id} selected={languages.includes(option.id)} onClick={() => setLanguages((current) => toggle(current, option.id))}>
              {option.label}
            </ChipPick>
          ))}
        </div>
      </Field>
    </div>
  );
}

function AccentStep({ value, onChange, reduce }) {
  const custom = parseCustomAccent(value);
  return (
    <div className="sf-accent-step">
      <div className="sf-swatch-grid">
        {ACCENTS.map((option, index) => (
          <motion.button
            key={option.id}
            type="button"
            className={value === option.id ? "sf-swatch is-on" : "sf-swatch"}
            data-accent-swatch={option.id}
            aria-pressed={value === option.id}
            aria-label={option.label}
            onClick={() => onChange(option.id)}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.28, delay: index * 0.03, ease: EASE }}
            whileHover={reduce ? undefined : { y: -3 }}
            whileTap={reduce ? undefined : { scale: 0.96 }}
          >
            <span>{option.label}</span>
          </motion.button>
        ))}
        <button
          type="button"
          className={custom ? "sf-swatch sf-swatch-custom is-on" : "sf-swatch sf-swatch-custom"}
          aria-pressed={Boolean(custom)}
          style={custom ? { backgroundImage: `linear-gradient(135deg, ${custom.start}, ${custom.end})` } : undefined}
          onClick={() => {
            if (!custom) onChange("custom:#6d28d9:#2563eb");
          }}
        >
          <span>Custom</span>
        </button>
      </div>
      {custom ? <CustomAccentForm start={custom.start} end={custom.end} onChange={onChange} /> : null}
    </div>
  );
}

function ReadyStep({ name, paths, stage, goals, pace, weeklyHours, city, accent }) {
  const accentChoice = ACCENTS.find((item) => item.id === accent);
  const customAccent = parseCustomAccent(accent);
  const customPreview = customAccent ? customThemeVars(customAccent.start, customAccent.end) : null;
  const first = paths[0];
  return (
    <div className="sf-ready sf-onboard-ready">
      {first ? (
        <div className="sf-ready-photo">
          <SkillImage src={first.image} alt="" fill sizes="240px" />
        </div>
      ) : null}
      <div>
        {name ? <p className="sf-ready-name">{name}</p> : null}
        <p className="sf-ready-skill">{paths.map((path) => path.name).join(" · ")}</p>
        <ul className="sf-ready-meta">
          <li>
            <Icon name="user" size={15} />
            {labelOf(STAGES, stage)}
          </li>
          <li>
            <Icon name="compass" size={15} />
            {goals.map((goal) => labelOf(GOALS, goal)).join(", ")}
          </li>
          <li>
            <Icon name={paceById(pace).icon} size={15} />
            {paceById(pace).label} · {labelOf(WEEKLY_HOURS, weeklyHours)}
          </li>
          {city ? (
            <li>
              <Icon name="map-pin" size={15} />
              {city}
            </li>
          ) : null}
          <li>
            <span
              className="sf-ready-dot"
              data-accent-swatch={isAccentId(accent) ? accent : undefined}
              style={customPreview ? { backgroundImage: customPreview["--preset-gradient"] } : undefined}
            />
            {accentChoice?.label ?? "Custom"}
          </li>
        </ul>
        <p className="sf-onboard-hint">Not sure these are the right paths? Home has a career-fit test you can take any time.</p>
      </div>
    </div>
  );
}

function Pick({ selected, onClick, reduce, delay = 0, disabled = false, children }) {
  return (
    <motion.button
      type="button"
      className={selected ? "sf-pick is-on" : "sf-pick"}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.28, delay: delay * 0.04, ease: EASE }}
      whileHover={reduce || disabled ? undefined : { y: -3 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
    >
      {selected ? (
        <span className="sf-pick-check">
          <Icon name="check" size={12} strokeWidth={3} color="#fff" />
        </span>
      ) : null}
      {children}
    </motion.button>
  );
}

function ChipPick({ selected, onClick, icon, children }) {
  return (
    <button type="button" className={selected ? "sf-chip-pick is-on" : "sf-chip-pick"} aria-pressed={selected} onClick={onClick}>
      {selected ? <Icon name="check" size={13} strokeWidth={3} /> : icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </button>
  );
}
