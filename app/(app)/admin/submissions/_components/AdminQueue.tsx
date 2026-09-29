"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { reviewSubmission } from "../actions";
import type { SubmissionStatus, SubmissionView } from "@/lib/types/domain";

const TABS: SubmissionStatus[] = ["PENDING", "APPROVED", "REJECTED"];
const LABEL = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" } as const;

export function AdminQueue({ initial }: { initial: SubmissionView[] }) {
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<SubmissionStatus>("PENDING");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const open = items.find((item) => item.id === openId) ?? null;
  const visible = items.filter((item) => item.status === tab);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function decide(decision: "approve" | "reject") {
    if (!open) return;
    setPending(decision);
    setError("");
    const result = await reviewSubmission({ id: open.id, decision, notes });
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const status: SubmissionStatus = decision === "approve" ? "APPROVED" : "REJECTED";
    setItems((current) => current.map((item) => (item.id === open.id ? { ...item, status, reviewNotes: notes || null } : item)));
    setMessage(decision === "approve" ? "Approved. It can appear on the roadmap." : "Rejected. The learner can read the note.");
    setOpenId(null);
    setNotes("");
  }

  return (
    <div className="sf-admin">
      <p className="sf-review-live" aria-live="polite">{message || error}</p>
      <div className="sf-admin-tabs" role="tablist" aria-label="Submission status">
        {TABS.map((status) => (
          <button key={status} type="button" role="tab" aria-selected={tab === status} onClick={() => setTab(status)}>
            {LABEL[status]} ({items.filter((item) => item.status === status).length})
          </button>
        ))}
      </div>
      {visible.length ? (
        <table className="sf-admin-table">
          <caption>Resource suggestions</caption>
          <thead>
            <tr>
              <th scope="col">Resource</th>
              <th scope="col">Link</th>
              <th scope="col">Type</th>
              <th scope="col">Skill</th>
              <th scope="col">Learner</th>
              <th scope="col">Submitted</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td><button type="button" onClick={() => { setOpenId(item.id); setNotes(item.reviewNotes ?? ""); setError(""); setConfirmApprove(false); }}>{item.title}</button></td>
                <td><a href={item.url} target="_blank" rel="noopener noreferrer">Open link, opens in a new tab</a></td>
                <td>{item.type === "DOC_LINK" ? "Doc" : item.type === "EMBEDDED_VIDEO" ? "Video" : item.type === "COURSE_LINK" ? "Course" : "Clip"}</td>
                <td>{item.skillName} · {item.stageTitle}</td>
                <td>{item.submitterName}</td>
                <td>{item.createdAt.slice(0, 10)}</td>
                <td><Chip tone={item.status === "APPROVED" ? "pass" : item.status === "REJECTED" ? "fail" : "warn"}>{LABEL[item.status]}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState compact icon="inbox" title={tab === "PENDING" ? "No pending submissions" : `No ${LABEL[tab].toLowerCase()} submissions`} description="New suggestions will land in Pending." />
      )}
      {open ? (
        <div className="sf-dialog-backdrop" onMouseDown={() => setOpenId(null)}>
          <div ref={panelRef} className="sf-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
            <h2 id={titleId}>{open.title}</h2>
            <p>{open.skillName} · {open.stageTitle}</p>
            <p>{open.description}</p>
            <p><a href={open.url} target="_blank" rel="noopener noreferrer">Open the resource, opens in a new tab</a></p>
            <label>
              Review notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
            </label>
            {error ? <p role="alert">{error}</p> : null}
            {confirmApprove ? <p>This publishes the resource to the roadmap.</p> : null}
            <div>
              {confirmApprove ? (
                <button type="button" disabled={pending !== ""} onClick={() => void decide("approve")}>{pending === "approve" ? "Approving..." : "Confirm approval"}</button>
              ) : (
                <button type="button" disabled={pending !== ""} onClick={() => setConfirmApprove(true)}>Approve</button>
              )}
              <button type="button" disabled={pending !== ""} onClick={() => void decide("reject")}>{pending === "reject" ? "Rejecting..." : "Reject"}</button>
            </div>
            <p>A rejection needs a note, and the learner sees it.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
