export type ContributionStatus = "OPEN" | "CHANGES_REQUESTED" | "MERGED" | "CLOSED";
export type ReviewDecision = "APPROVE" | "REQUEST_CHANGES" | "CLOSE";

export type Transition =
  | { ok: true; status: ContributionStatus }
  | { ok: false; error: string };

/** One review decision. Approve only moves an open contribution to merged. */
export function reviewTransition(status: ContributionStatus, decision: ReviewDecision): Transition {
  if (decision === "APPROVE") {
    if (status !== "OPEN") return { ok: false, error: "Approve a contribution after the author has resubmitted it." };
    return { ok: true, status: "MERGED" };
  }
  if (decision === "REQUEST_CHANGES") {
    return { ok: false, error: "Approve or reject this post." };
  }
  if (status !== "OPEN" && status !== "CHANGES_REQUESTED") {
    return { ok: false, error: "Reject a post that is still waiting." };
  }
  return { ok: true, status: "CLOSED" };
}

/** Author edits, resubmits a merged contribution, or withdraws. */
export function authorTransition(status: ContributionStatus, action: "edit" | "withdraw" | "resubmit"): Transition {
  if (action === "withdraw") {
    if (status !== "OPEN" && status !== "CHANGES_REQUESTED") {
      return { ok: false, error: "Withdraw a contribution that is still open." };
    }
    return { ok: true, status: "CLOSED" };
  }
  if (action === "resubmit") {
    if (status !== "MERGED") return { ok: false, error: "Resubmit a contribution that is already public." };
    return { ok: true, status: "OPEN" };
  }
  if (status !== "OPEN" && status !== "CHANGES_REQUESTED") {
    return { ok: false, error: "Edit a contribution that is open or waiting on your changes." };
  }
  return { ok: true, status: "OPEN" };
}

/** Maintainer or admin hides a merged contribution. */
export function unmergeTransition(status: ContributionStatus): Transition {
  if (status !== "MERGED") return { ok: false, error: "Hide a post that is published." };
  return { ok: true, status: "CLOSED" };
}
