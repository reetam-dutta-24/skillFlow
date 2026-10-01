"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { Button } from "@/components/core/Button.jsx";
import { reportGapAction, type FormState } from "../actions";

type Stage = { id: string; order: number; title: string };

/** Any signed-in learner can report a gap. Three in 24 hours, counted in the service. */
export function GapForm({ skillId, slug, stages }: { skillId: string; slug: string; stages: Stage[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(reportGapAction, null as FormState);

  // A transition keeps the typed text when the server returns an error.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Report a gap
      </Button>
    );
  }

  return (
    <form className="sf-os-form sf-os-gap-form" onSubmit={onSubmit}>
      <input type="hidden" name="skillId" value={skillId} />
      <input type="hidden" name="slug" value={slug} />
      <label>
        What is missing?
        <input name="title" required maxLength={120} placeholder="A short name for the gap" aria-invalid={state?.field === "title"} />
      </label>
      <label>
        Describe it
        <textarea name="description" required rows={4} maxLength={1000} placeholder="What a learner needs here and cannot find yet." aria-invalid={state?.field === "description"} />
      </label>
      {stages.length > 0 ? (
        <label>
          Stage
          <select name="stageId" defaultValue="" aria-invalid={state?.field === "stageId"}>
            <option value="">Not one stage</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                Stage {stage.order}: {stage.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {state ? (
        <p className="sf-auth-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="sf-community-actions">
        <Button type="submit" size="sm" variant="gradient" disabled={pending}>
          {pending ? "Reporting…" : "Report gap"}
        </Button>
        <Button type="button" size="sm" variant="quiet" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <p className="sf-os-hint">You can report 3 gaps in 24 hours.</p>
    </form>
  );
}
