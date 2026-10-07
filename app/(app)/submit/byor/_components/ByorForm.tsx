"use client";

import { useState } from "react";
import { WizardCard } from "@/components/forms/WizardCard";
import { SourceField } from "@/components/forms/SourceField";
import { storedSource } from "@/lib/stored-source";
import { BYOR_UNSUPPORTED_URL } from "@/lib/mock/config";

/** Sample gate for the preview. A real one is written from the resource the learner brings. */
const PREVIEW = {
  question: "In your own words, why does useEffect need a dependency array?",
  covers: [
    "Which values the effect reads from the render",
    "When React re-runs the effect, and when it skips it",
    "What an empty array changes",
  ],
};

export function ByorForm() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError("");
  }

  function continueStep() {
    if (!storedSource(url)) {
      setError("Upload a file, or use an https link.");
      return;
    }
    go(1);
  }

  async function generate() {
    setError("");
    setReady(false);
    if (!storedSource(url)) {
      setError("Upload a file, or use an https link.");
      return;
    }
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setPending(false);
    if (url.trim() === BYOR_UNSUPPORTED_URL) {
      setError("This link cannot become an explain-back prompt. Try a documentation page.");
      return;
    }
    setReady(true);
  }

  return (
    <WizardCard
      step={step}
      total={2}
      title={step === 0 ? "Which resource?" : "Where does it belong?"}
      direction={direction}
      onStep={go}
      onBack={() => go(0)}
      onNext={step === 0 ? continueStep : () => void generate()}
      nextLabel={step === 0 ? "Continue" : "Create explain-back prompt"}
      pending={pending}
      error={error}
    >
      {step === 0 ? <SourceField label="Resource link" value={url} onChange={setUrl} /> : null}
      {step === 1 ? (
        <>
          <label>
            Stage, optional
            <input value={stage} onChange={(event) => setStage(event.target.value)} />
          </label>
          {ready ? (
            <section aria-labelledby="byor-ready">
              <h3 id="byor-ready">Explain-back gate ready</h3>
              <p>{PREVIEW.question}</p>
              <p>A complete answer covers:</p>
              <ul>
                {PREVIEW.covers.map((point) => <li key={point}>{point}</li>)}
              </ul>
              <p className="sf-fill-hint">Answer it in your own words. A follow-up asks about whatever was unclear.</p>
            </section>
          ) : null}
        </>
      ) : null}
    </WizardCard>
  );
}
