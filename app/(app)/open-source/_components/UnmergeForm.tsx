"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/core/Button.jsx";
import { REVIEW_REASON_OPTIONS } from "@/lib/community-copy";
import { unmergeContributionAction, type FormState } from "../actions";

/** Maintainers and admins only. The page decides whether to render it, and the action checks again. */
export function UnmergeForm({ contributionId }: { contributionId: string }) {
  const [state, action, pending] = useActionState(unmergeContributionAction, null as FormState);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // Controlled so an error keeps them. React resets uncontrolled fields after a form action.
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const hint = useId();

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Hide
      </Button>
    );
  }

  return (
    <form className="sf-os-form sf-os-review-form" action={action}>
      <input type="hidden" name="contributionId" value={contributionId} />
      <label>
        Reason
        <select name="reason" required value={reason} onChange={(event) => setReason(event.target.value)} aria-invalid={state?.field === "reason"}>
          <option value="" disabled>
            Choose a reason
          </option>
          {REVIEW_REASON_OPTIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Note for the author (optional)
        <textarea
          name="feedback"
          rows={3}
          maxLength={500}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          aria-describedby={hint}
          aria-invalid={state?.field === "feedback"}
        />
        <span className="sf-os-hint" id={hint}>
          {feedback.length}/500
        </span>
      </label>
      {state ? (
        <p className="sf-auth-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {confirming ? (
        <p className="sf-os-hint" role="status">
          It leaves the public list now.
        </p>
      ) : null}
      <div className="sf-community-actions">
        {confirming ? (
          <Button type="submit" variant="outline" size="sm" disabled={pending || !reason}>
            {pending ? "Hiding…" : "Confirm hide"}
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={!reason} onClick={() => setConfirming(true)}>
            Hide
          </Button>
        )}
        <Button
          type="button"
          variant="quiet"
          size="sm"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setConfirming(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
