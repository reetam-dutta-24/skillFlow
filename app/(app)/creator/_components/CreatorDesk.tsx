"use client";

import { useState } from "react";
import { Button } from "@/components/core/Button.jsx";
import { Chip } from "@/components/core/Chip.jsx";
import { SourceField } from "@/components/forms/SourceField";
import { storedSource } from "@/lib/stored-source";

type Status = "none" | "pending" | "verified";

export function CreatorDesk({ initial }: { initial: Status }) {
  const [status, setStatus] = useState<Status>(initial);
  const [pending, setPending] = useState(false);
  const [samples, setSamples] = useState("");
  const [sampleError, setSampleError] = useState("");

  if (status === "verified") {
    return (
      <div className="sf-creator">
        <Chip tone="pass">Verified</Chip>
        <h2>Your submitted content</h2>
        <ul>
          <li>Hooks & State resource — Approved</li>
          <li>Learner quiz success rate: 78%</li>
        </ul>
        <p>The quality signal is how often learners pass the quiz, not how many times the page was opened.</p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="sf-creator">
        <Chip tone="warn">Pending</Chip>
        <p>Your application is in review. You can keep learning while it waits.</p>
      </div>
    );
  }

  return (
    <form
      className="sf-v2-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!storedSource(samples)) {
          setSampleError("Upload a file, or use an https link.");
          return;
        }
        setSampleError("");
        setPending(true);
        window.setTimeout(() => {
          setPending(false);
          setStatus("pending");
        }, 600);
      }}
    >
      <Chip tone="neutral">Not applied</Chip>
      <label>
        Expertise
        <input required />
      </label>
      <SourceField label="Sample links" value={samples} onChange={(value) => { setSamples(value); setSampleError(""); }} />
      {sampleError ? <p role="alert">{sampleError}</p> : null}
      <label>
        Statement
        <textarea required rows={4} />
      </label>
      <Button type="submit" variant="gradient" disabled={pending}>{pending ? "Sending..." : "Apply"}</Button>
    </form>
  );
}
