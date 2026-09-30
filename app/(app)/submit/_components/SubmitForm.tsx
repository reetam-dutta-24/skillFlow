"use client";

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { SkillImage } from "@/components/core/SkillImage";
import { SourceField } from "@/components/forms/SourceField";
import { storedSource } from "@/lib/stored-source";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { PaginationDots } from "@/components/navigation/PaginationDots.jsx";
import { submitResource } from "../actions";

type SkillOption = { id: string; slug: string; name: string; image: string; stages: { id: string; title: string }[] };

const STEPS = ["skill", "stage", "kind", "details", "review"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;
const TYPES = [
  { id: "DOC_LINK", label: "Documentation", hint: "A page that teaches the idea", icon: "file-text" },
  { id: "EMBEDDED_VIDEO", label: "Video", hint: "A lesson you can watch", icon: "clapperboard" },
  { id: "COURSE_LINK", label: "Course", hint: "A longer path on the topic", icon: "graduation-cap" },
];

function stepTitle(step: number) {
  if (step === 0) return "Which skill?";
  if (step === 1) return "Which stage?";
  if (step === 2) return "What kind of resource?";
  if (step === 3) return "The lesson itself";
  return "Send it for review";
}

export function SubmitForm({ skills }: { skills: SkillOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const preset = params.get("stageId") ?? "";
  const presetSkill = skills.find((skill) => skill.stages.some((stage) => stage.id === preset))?.id ?? "";
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [skillId, setSkillId] = useState(presetSkill);
  const [stageId, setStageId] = useState(preset);
  const [type, setType] = useState("DOC_LINK");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const stages = useMemo(() => skills.find((skill) => skill.id === skillId)?.stages ?? [], [skills, skillId]);
  const skill = skills.find((item) => item.id === skillId) ?? null;
  const stage = stages.find((item) => item.id === stageId) ?? null;
  const kind = TYPES.find((item) => item.id === type) ?? TYPES[0];
  const ready = step === STEPS.length - 1;

  const motionStep = reduce
    ? { initial: false, animate: { opacity: 1, x: 0 }, exit: { opacity: 1, x: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, x: direction * 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -24 },
        transition: { duration: 0.34, ease: EASE },
      };

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setFieldError("");
    setError("");
    window.setTimeout(() => titleRef.current?.focus(), 0);
  }

  function continueStep() {
    if (step === 0 && !skillId) {
      setFieldError("Choose a skill.");
      return;
    }
    if (step === 1 && !stageId) {
      setFieldError("Choose a stage.");
      return;
    }
    if (step === 3) {
      if (!title.trim()) {
        setFieldError("Add a title.");
        return;
      }
      if (!storedSource(url)) {
        setFieldError("Upload a file, or use an https link.");
        return;
      }
    }
    go(step + 1);
  }

  async function finish(event: FormEvent) {
    event.preventDefault();
    if (!stageId) return;
    setPending(true);
    setError("");
    const result = await submitResource({ stageId, type, url, title, description });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
    setDone(true);
  }

  if (done) {
    return (
      <motion.div
        className="sf-wizard-card sf-contribute-card"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.4, ease: EASE }}
        role="status"
      >
        <h2>Sent for review</h2>
        <p>An admin will look at this suggestion. It stays off the roadmap until it is approved.</p>
        <Button
          type="button"
          variant="gradient"
          onClick={() => {
            setDone(false);
            setStep(0);
            setTitle("");
            setUrl("");
            setDescription("");
          }}
        >
          Suggest another
        </Button>
      </motion.div>
    );
  }

  return (
    <form className="sf-contribute" onSubmit={(event) => void finish(event)}>
      <motion.div className="sf-wizard-card sf-contribute-card">
        <div className="sf-wizard-track" aria-hidden="true">
          <motion.span
            className="sf-wizard-fill"
            initial={false}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={reduce ? { duration: 0 } : { duration: 0.35, ease: EASE }}
          />
        </div>
        <PaginationDots total={STEPS.length} current={step} onChange={(index: number) => index < step && go(index)} />
        <div className="sf-wizard-stage">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={STEPS[step]} className="sf-wizard-step" {...motionStep}>
              <h2 ref={titleRef} tabIndex={-1}>
                {stepTitle(step)}
              </h2>
              {step === 0 ? (
                <div className="sf-pick-grid sf-pick-skills">
                  {skills.map((item, index) => (
                    <Pick
                      key={item.id}
                      selected={skillId === item.id}
                      reduce={Boolean(reduce)}
                      delay={index}
                      onClick={() => {
                        setSkillId(item.id);
                        setStageId(item.stages[0]?.id ?? "");
                        setFieldError("");
                      }}
                    >
                      <span className="sf-pick-photo">
                        {item.image ? <SkillImage src={item.image} alt="" fill sizes="180px" /> : null}
                      </span>
                      <span className="sf-pick-label">{item.name}</span>
                    </Pick>
                  ))}
                </div>
              ) : null}
              {step === 1 ? (
                <div className="sf-pick-grid">
                  {stages.map((item, index) => (
                    <Pick
                      key={item.id}
                      selected={stageId === item.id}
                      reduce={Boolean(reduce)}
                      delay={index}
                      onClick={() => {
                        setStageId(item.id);
                        setFieldError("");
                      }}
                    >
                      <span className="sf-pick-icon">
                        <Icon name="route" size={18} />
                      </span>
                      <span className="sf-pick-label">{item.title}</span>
                      <span className="sf-pick-hint">Stage {index + 1}</span>
                    </Pick>
                  ))}
                </div>
              ) : null}
              {step === 2 ? (
                <div className="sf-pick-grid">
                  {TYPES.map((item, index) => (
                    <Pick key={item.id} selected={type === item.id} reduce={Boolean(reduce)} delay={index} onClick={() => setType(item.id)}>
                      <span className="sf-pick-icon">
                        <Icon name={item.icon} size={18} />
                      </span>
                      <span className="sf-pick-label">{item.label}</span>
                      <span className="sf-pick-hint">{item.hint}</span>
                    </Pick>
                  ))}
                </div>
              ) : null}
              {step === 3 ? (
                <div className="sf-contribute-fields">
                  <label>
                    Title
                    <input value={title} onChange={(event) => { setTitle(event.target.value); setFieldError(""); }} />
                  </label>
                  <SourceField label="Link" value={url} onChange={(value) => { setUrl(value); setFieldError(""); }} />
                  <label>
                    Description
                    <textarea value={description} rows={3} onChange={(event) => setDescription(event.target.value)} />
                  </label>
                </div>
              ) : null}
              {step === 4 && skill && stage ? (
                <div className="sf-ready">
                  <div className="sf-ready-photo">
                    {skill.image ? <SkillImage src={skill.image} alt="" fill sizes="160px" /> : null}
                  </div>
                  <div>
                    <p className="sf-ready-skill">{title.trim() || "Untitled"}</p>
                    <ul className="sf-ready-meta">
                      <li>
                        <Icon name="library" size={15} />
                        {skill.name}
                      </li>
                      <li>
                        <Icon name="route" size={15} />
                        {stage.title}
                      </li>
                      <li>
                        <Icon name={kind.icon} size={15} />
                        {kind.label}
                      </li>
                    </ul>
                    <p className="sf-pick-hint">{url}</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
        {fieldError || error ? (
          <p className="sf-auth-error" role="alert">
            {fieldError || error}
          </p>
        ) : null}
        <div className="sf-wizard-nav">
          <Button type="button" variant="ghost" disabled={step === 0 || pending} onClick={() => go(step - 1)}>
            Back
          </Button>
          {ready ? (
            <Button type="submit" variant="gradient" size="lg" disabled={pending}>
              {pending ? "Sending" : "Send suggestion"}
            </Button>
          ) : (
            <Button type="button" variant="gradient" size="lg" onClick={continueStep}>
              Continue
            </Button>
          )}
        </div>
        <p className="sf-wizard-live" aria-live="polite">
          Step {step + 1} of {STEPS.length}. {stepTitle(step)}
        </p>
      </motion.div>
    </form>
  );
}

function Pick({
  selected,
  onClick,
  reduce,
  delay,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  reduce: boolean;
  delay: number;
  children: ReactNode;
}) {
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
