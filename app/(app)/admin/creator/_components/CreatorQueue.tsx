"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import type { CreatorQueueItem } from "@/lib/data/creator";
import { reviewCreatorWork } from "../actions";

export function CreatorQueue({ items }: { items: CreatorQueueItem[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function decide(id: string, decision: "approve" | "reject") {
    setPending(`${id}:${decision}`);
    setError("");
    setMessage("");
    const result = await reviewCreatorWork({ id, decision, notes: notes[id] ?? "" });
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(decision === "approve" ? "Approved. It is on that niche’s clip feed." : "Rejected. The creator can read the note.");
    router.refresh();
  }

  if (items.length === 0) {
    return <EmptyState icon="video" title="No videos waiting" description="A creator video shows up here after they send it for review." />;
  }

  return (
    <div className="sf-creator-queue">
      {message ? <p role="status">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <article className="sf-creator-card">
              <h2>{item.title}</h2>
              <p>
                {item.ownerName} · {item.skillName} · {item.format === "short" ? "Short clip" : "Video"}
              </p>
              {item.description ? <p>{item.description}</p> : null}
              <video src={item.mediaUrl} controls playsInline preload="metadata" />
              <label>
                Note
                <textarea
                  rows={3}
                  value={notes[item.id] ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                />
              </label>
              <div className="sf-creator-actions">
                <Button type="button" variant="gradient" size="sm" disabled={pending !== ""} onClick={() => void decide(item.id, "approve")}>
                  {pending === `${item.id}:approve` ? "Approving…" : "Approve"}
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={pending !== ""} onClick={() => void decide(item.id, "reject")}>
                  {pending === `${item.id}:reject` ? "Rejecting…" : "Reject"}
                </Button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
