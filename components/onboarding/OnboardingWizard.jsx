"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ACCENTS, applyAccent, isAccentId } from "@/lib/accent";
import { GOAL_CHOICES, PACE_CHOICES, SKILL_CHOICES, goalById, paceById, skillBySlug } from "@/lib/learner";
import { saveLearnerProfile } from "@/app/onboarding/actions";
import { ThemeToggle } from "../forms/ThemeToggle.jsx";
import { Button } from "../core/Button.jsx";
import { Icon } from "../core/Icon.jsx";
import { PaginationDots } from "../navigation/PaginationDots.jsx";

const STEPS = ["skill", "pace", "goal", "accent", "ready"];
const EASE = [0.22, 1, 0.36, 1];

export function OnboardingWizard({ name = "", initial = null }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const titleRef = useRef(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [skillSlug, setSkillSlug] = useState(initial?.skillSlug ?? "");
  const [pace, setPace] = useState(initial?.pace ?? "");
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [accent, setAccent] = useState(isAccentId(initial?.accent) ? initial.accent : "dusk");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isAccentId(accent)) applyAccent(accent);
  }, [accent]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [step]);

  const ready = step === STEPS.length - 1;
  const canContinue =
    (step === 0 && Boolean(skillSlug)) ||
    (step === 1 && Boolean(pace)) ||
    (step === 2 && Boolean(goal)) ||
    step >= 3;

  function go(next) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError(null);
  }

  async function finish() {
    setPending(true);
    setError(null);
    const result = await saveLearnerProfile({ skillSlug, pace, goal, accent });
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
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

  return (
    <div className="sf-wizard">
      <div className="sf-wizard-bar">
        <a className="sf-wordmark" href="/">
          SkillFlow
        </a>
        <ThemeToggle quiet />
      </div>
      <div className="sf-wizard-card">
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
            <motion.div key={STEPS[step]} className="sf-wizard-step" {...motionProps}>
              <h1 ref={titleRef} tabIndex={-1}>
                {stepTitle(step)}
              </h1>
              {step === 0 ? <SkillStep value={skillSlug} onChange={setSkillSlug} reduce={reduce} /> : null}
              {step === 1 ? <ChoiceStep options={PACE_CHOICES} value={pace} onChange={setPace} reduce={reduce} /> : null}
              {step === 2 ? <ChoiceStep options={GOAL_CHOICES} value={goal} onChange={setGoal} reduce={reduce} /> : null}
              {step === 3 ? <AccentStep value={accent} onChange={setAccent} reduce={reduce} /> : null}
              {step === 4 ? <ReadyStep name={name} skillSlug={skillSlug} pace={pace} goal={goal} accent={accent} /> : null}
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
          <Button type="button" variant="gradient" size="lg" disabled={!canContinue || pending} onClick={ready ? finish : () => go(step + 1)}>
            {ready ? (pending ? "Saving" : "Open dashboard") : "Continue"}
          </Button>
        </div>
        <p className="sf-wizard-live" aria-live="polite">
          Step {step + 1} of {STEPS.length}. {stepTitle(step)}
        </p>
      </div>
    </div>
  );
}

function stepTitle(step) {
  if (step === 0) return "Pick a skill";
  if (step === 1) return "Your pace";
  if (step === 2) return "Your goal";
  if (step === 3) return "Your color";
  return "You're set";
}

function SkillStep({ value, onChange, reduce }) {
  return (
    <div className="sf-pick-grid sf-pick-skills">
      {SKILL_CHOICES.map((skill, index) => (
        <Pick
          key={skill.slug}
          selected={value === skill.slug}
          onClick={() => onChange(skill.slug)}
          reduce={reduce}
          delay={index}
        >
          <span className="sf-pick-photo">
            <Image src={skill.image} alt="" fill sizes="(min-width: 720px) 180px, 42vw" />
          </span>
          <span className="sf-pick-label">{skill.title}</span>
        </Pick>
      ))}
    </div>
  );
}

function ChoiceStep({ options, value, onChange, reduce }) {
  return (
    <div className="sf-pick-grid">
      {options.map((option, index) => (
        <Pick key={option.id} selected={value === option.id} onClick={() => onChange(option.id)} reduce={reduce} delay={index}>
          <span className="sf-pick-icon">
            <Icon name={option.icon} size={22} />
          </span>
          <span className="sf-pick-label">{option.label}</span>
          {option.hint ? <span className="sf-pick-hint">{option.hint}</span> : null}
        </Pick>
      ))}
    </div>
  );
}

function AccentStep({ value, onChange, reduce }) {
  return (
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
    </div>
  );
}

function ReadyStep({ name, skillSlug, pace, goal, accent }) {
  const skill = skillBySlug(skillSlug);
  const paceChoice = paceById(pace);
  const goalChoice = goalById(goal);
  const accentChoice = ACCENTS.find((item) => item.id === accent);
  if (!skill) return null;
  return (
    <div className="sf-ready">
      <div className="sf-ready-photo">
        <Image src={skill.image} alt="" fill sizes="240px" />
      </div>
      <div>
        {name ? <p className="sf-ready-name">{name}</p> : null}
        <p className="sf-ready-skill">{skill.title}</p>
        <ul className="sf-ready-meta">
          <li>
            <Icon name={paceChoice.icon} size={15} />
            {paceChoice.label}
          </li>
          <li>
            <Icon name={goalChoice.icon} size={15} />
            {goalChoice.label}
          </li>
          <li>
            <span className="sf-ready-dot" data-accent-swatch={accent} />
            {accentChoice?.label}
          </li>
        </ul>
      </div>
    </div>
  );
}

function Pick({ selected, onClick, reduce, delay = 0, children }) {
  return (
    <motion.button
      type="button"
      className={selected ? "sf-pick is-on" : "sf-pick"}
      aria-pressed={selected}
      onClick={onClick}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.28, delay: delay * 0.04, ease: EASE }}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
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
