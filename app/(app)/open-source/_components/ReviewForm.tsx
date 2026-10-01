"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/core/Button.jsx";
import { REVIEW_REASON_OPTIONS } from "@/lib/community-copy";
import { reviewContributionAction, type ReviewState } from "../actions";

export type Decision = "APPROVE" | "REQUEST_CHANGES" | "CLOSE";

const DECISIONS: { id: Decision; label: string; hint: string }[] = [
  { id: "APPROVE", label: "Approve", hint: "Merge it. It becomes public in this niche." },
  { id: "REQUEST_CHANGES", label: "Request changes", hint: "Send it back. The author can edit and resubmit." },
  { id: "CLOSE", label: "Close", hint: "End it. The author cannot reopen it." },
];

const SUBMIT_LABEL: Record<Decision, string> = {
  APPROVE: "Approve and merge",
  REQUEST_CHANGES: "Send back for changes",
  CLOSE: "Confirm close",
};

/** `allowed` follows the status: an open contribution takes all three, one waiting on changes can only be closed. */
export function ReviewForm({
  contributionId,
  revision,
  allowed,
}: {
  contributionId: string;
  revision: number;
  allowed: Decision[];
}) {
  const [state, action, pending] = useActionState(reviewContributionAction, null as ReviewState);
  const options = DECISIONS.filter((item) => allowed.includes(item.id));
  const [decision, setDecision] = useState<Decision>(options[0]?.id ?? "CLOSE");
  const [confirmClose, setConfirmClose] = useState(false);
  // Controlled so an error does not clear them. React resets uncontrolled fields after a form action.
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const feedbackHint = useId();
  const needsReason = decision !== "APPROVE";
  const needsFeedback = decision === "REQUEST_CHANGES";

  function choose(next: Decision) {
    setDecision(next);
    setConfirmClose(false);
  }

  return (
    <form className="sf-os-form sf-os-review-form" action={action}>
      <input type="hidden" name="contributionId" value={contributionId} />
      <input type="hidden" name="revision" value={revision} />

      <fieldset className="sf-os-decisions">
        <legend>Decision</legend>
        {options.map((item) => (
          <label key={item.id} className="sf-os-decision">
            <input type="radio" name="decision" value={item.id} checked={decision === item.id} onChange={() => choose(item.id)} />
            <span>
              <strong>{item.label}</strong>
              <span className="sf-os-hint">{item.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {needsReason ? (
        <label>
          Reason
          <select name="reason" required value={reason} onChange={(event) => setReason(event.target.value)} aria-invalid={state?.field === "reason"}>
            <option value="" disabled>
              Choose a reason
            </option>
            {REVIEW_REASON_OPTIONS.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label>
        {needsFeedback ? "Feedback for the author" : "Feedback for the author (optional)"}
        <textarea
          name="feedback"
          rows={4}
          maxLength={500}
          required={needsFeedback}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          aria-describedby={feedbackHint}
          aria-invalid={state?.field === "feedback"}
        />
        <span className="sf-os-hint" id={feedbackHint}>
          {feedback.length}/500. One note. The author sees it with your decision.
        </span>
      </label>

      {state ? (
        <p className="sf-auth-error" role="alert">
          {state.error}
        </p>
      ) : null}

      {decision === "CLOSE" && confirmClose ? (
        <p className="sf-os-hint" role="status">
          Closing is final. Choose Confirm close to continue.
        </p>
      ) : null}

      <div className="sf-community-actions">
        {decision === "CLOSE" && !confirmClose ? (
          <Button type="button" variant="outline" onClick={() => setConfirmClose(true)}>
            Close contribution
          </Button>
        ) : (
          <Button type="submit" variant={decision === "APPROVE" ? "gradient" : "outline"} disabled={pending}>
            {pending ? "Saving…" : SUBMIT_LABEL[decision]}
          </Button>
        )}
        {decision === "CLOSE" && confirmClose ? (
          <Button type="button" variant="quiet" disabled={pending} onClick={() => setConfirmClose(false)}>
            Keep it open
          </Button>
        ) : null}
      </div>
    </form>
  );
}
