"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/core/Button.jsx";
import { PaginationDots } from "@/components/navigation/PaginationDots.jsx";

const EASE = [0.22, 1, 0.36, 1] as const;

/** One step of a form that sends a single request at the end. */
export function WizardCard({
  step,
  total,
  title,
  direction,
  onStep,
  onBack,
  onNext,
  nextLabel = "Continue",
  pending = false,
  error,
  children,
  actions,
}: {
  step: number;
  total: number;
  title: string;
  direction: number;
  onStep: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  pending?: boolean;
  error?: string;
  children: ReactNode;
  /** Replaces Continue on the last step when the form has more than one send action. */
  actions?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, [step]);

  const motionStep = reduce
    ? { initial: false as const, animate: { opacity: 1, x: 0 }, exit: { opacity: 1, x: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, x: direction * 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -24 },
        transition: { duration: 0.34, ease: EASE },
      };

  return (
    <div className="sf-wizard-card sf-fill-wizard">
      <div className="sf-wizard-track" aria-hidden="true">
        <motion.span
          className="sf-wizard-fill"
          initial={false}
          animate={{ width: `${((step + 1) / total) * 100}%` }}
          transition={reduce ? { duration: 0 } : { duration: 0.35, ease: EASE }}
        />
      </div>
      <PaginationDots total={total} current={step} onChange={(index: number) => index < step && onStep(index)} />
      <div className="sf-wizard-stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} className="sf-wizard-step" {...motionStep}>
            <h2 ref={titleRef} tabIndex={-1}>
              {title}
            </h2>
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
      {error ? (
        <p className="sf-auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="sf-wizard-nav">
        <Button type="button" variant="quiet" disabled={step === 0 || pending} onClick={onBack}>
          Back
        </Button>
        {actions ?? (
          <Button type="button" variant="gradient" disabled={pending} onClick={onNext}>
            {pending ? "Sending…" : nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
