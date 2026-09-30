"use client";

import { useId, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { Button } from "@/components/core/Button.jsx";
import { SourceField } from "@/components/forms/SourceField";
import { storedSource } from "@/lib/stored-source";

const CRITERIA = ["Correctness", "Clarity", "Edge cases", "Explanation"];

export function ProjectReview({ waiting }: { waiting: boolean }) {
  const [tab, setTab] = useState<"submit" | "review">("submit");
  const [report, setReport] = useState(false);
  const [notice, setNotice] = useState("");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const titleId = useId();

  return (
    <div className="sf-project">
      <div role="tablist" aria-label="Project review">
        <button type="button" role="tab" aria-selected={tab === "submit"} onClick={() => setTab("submit")}>Submit your project</button>
        <button type="button" role="tab" aria-selected={tab === "review"} onClick={() => setTab("review")}>Review a peer</button>
      </div>
      {tab === "submit" ? (
        <form className="sf-v2-form" onSubmit={(event) => {
          event.preventDefault();
          if (!storedSource(link)) {
            setLinkError("Upload a file, or use an https link.");
            return;
          }
          setLinkError("");
          setNotice("Submitted for a peer at your stage.");
        }}>
          <label>
            What you built
            <textarea required rows={5} />
          </label>
          <SourceField label="Link" value={link} onChange={(value) => { setLink(value); setLinkError(""); }} />
          {linkError ? <p role="alert">{linkError}</p> : null}
          <Button type="submit" variant="gradient">Submit project</Button>
          {notice ? <p role="status">{notice}</p> : null}
        </form>
      ) : waiting ? (
        <EmptyState compact icon="users" title="Waiting for a peer at your stage" description="When someone at this stage submits, their project will appear here." />
      ) : (
        <form className="sf-v2-form" onSubmit={(event) => { event.preventDefault(); setNotice("Review sent. There is no comment thread."); }}>
          {CRITERIA.map((name) => (
            <fieldset key={name}>
              <legend>{name}</legend>
              <div className="sf-rubric">
                {[1, 2, 3, 4].map((score) => (
                  <label key={score}>
                    <input type="radio" name={name} value={score} required />
                    {score}
                  </label>
                ))}
              </div>
              <label>
                Short note
                <input name={`${name}-note`} required />
              </label>
            </fieldset>
          ))}
          <div>
            <Button type="submit" variant="gradient">Send review</Button>
            <Button type="button" variant="outline" onClick={() => setReport(true)}>Report</Button>
          </div>
          {notice ? <p role="status">{notice}</p> : null}
        </form>
      )}
      {report ? (
        <div className="sf-dialog-backdrop" onMouseDown={() => setReport(false)}>
          <div className="sf-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
            <h2 id={titleId}>Report this project</h2>
            <p>Flag it if it is off-topic or not their own work. This is not a comment thread.</p>
            <label>
              Reason
              <textarea rows={3} />
            </label>
            <button type="button" onClick={() => { setReport(false); setNotice("Report received."); }}>Send report</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
