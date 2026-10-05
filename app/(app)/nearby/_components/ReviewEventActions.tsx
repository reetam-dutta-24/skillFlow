"use client";

import { useState } from "react";
import { reviewEvent } from "@/app/(app)/nearby/actions";

export function ReviewEventActions({ id }: { id: string }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (done) return <p>{done}</p>;

  function send(decision: "approve" | "reject") {
    setPending(true);
    setError(null);
    void reviewEvent({ id, decision, note }).then((result) => {
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(decision === "approve" ? "Approved." : "Rejected.");
    });
  }

  return (
    <div className="sf-event-review">
      <label>
        Note
        <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
      </label>
      <div className="sf-event-review-actions">
        <button type="button" disabled={pending} onClick={() => send("approve")}>
          Approve
        </button>
        <button type="button" disabled={pending} onClick={() => send("reject")}>
          Reject
        </button>
      </div>
      {error ? <p className="sf-event-error">{error}</p> : null}
    </div>
  );
}
