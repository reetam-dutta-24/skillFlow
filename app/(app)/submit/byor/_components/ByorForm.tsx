"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/core/Button.jsx";
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
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  async function generate(event: FormEvent) {
    event.preventDefault();
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
    <div className="sf-byor">
      <form className="sf-v2-form" onSubmit={(event) => void generate(event)}>
        <SourceField label="Resource link" value={url} onChange={setUrl} />
        <label>
          Stage, optional
          <input value={stage} onChange={(event) => setStage(event.target.value)} />
        </label>
        <Button type="submit" variant="gradient" disabled={pending}>{pending ? "Writing the prompt..." : "Create explain-back prompt"}</Button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      {ready ? (
        <section aria-labelledby="byor-ready">
          <h2 id="byor-ready">Explain-back gate ready</h2>
          <p>{PREVIEW.question}</p>
          <p>A complete answer covers:</p>
          <ul>
            {PREVIEW.covers.map((point) => <li key={point}>{point}</li>)}
          </ul>
          <p>Answer it in your own words. A follow-up asks about whatever was unclear.</p>
        </section>
      ) : null}
    </div>
  );
}
