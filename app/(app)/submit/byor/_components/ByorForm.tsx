"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/core/Button.jsx";
import { SourceField } from "@/components/forms/SourceField";
import { storedSource } from "@/lib/stored-source";
import { BYOR_UNSUPPORTED_URL } from "@/lib/mock/config";

const PREVIEW = [
  "What does an empty dependency array mean?",
  "When does the cleanup function run?",
  "Which value should the effect re-run for?",
  "Why is state tied to a position in the tree?",
  "What happens if the effect sets state without a dependency?",
];

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
      setError("This link cannot become a quiz. Try a documentation page.");
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
        <Button type="submit" variant="gradient" disabled={pending}>{pending ? "Generating..." : "Generate quiz"}</Button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      {ready ? (
        <section aria-labelledby="byor-ready">
          <h2 id="byor-ready">Quiz ready - 5 questions</h2>
          <ol>
            {PREVIEW.map((question) => <li key={question}>{question}</li>)}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
