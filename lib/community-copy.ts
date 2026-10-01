export const COMMUNITY_LABEL = "Community contributed · Reviewed, not verified by SkillFlow";

export const CONTRIBUTION_TYPES = [
  { id: "RESOURCE", label: "Resource" },
  { id: "CONCEPT_NOTE", label: "Concept note" },
  { id: "LEARNING_PATH", label: "Learning path" },
  { id: "FOLLOW", label: "Follow" },
] as const;

export function contributionTypeLabel(type: string) {
  return CONTRIBUTION_TYPES.find((item) => item.id === type)?.label ?? type;
}

export function disclosureLabel(disclosure: string) {
  if (disclosure === "I_MADE_THIS") return "I made this";
  if (disclosure === "AFFILIATE_OR_SPONSORED") return "Affiliate or sponsored";
  return null;
}

const CONTRIBUTION_STATUS: Record<string, string> = {
  OPEN: "Open",
  CHANGES_REQUESTED: "Changes requested",
  MERGED: "Merged",
  CLOSED: "Closed",
};

export function contributionStatusLabel(status: string) {
  return CONTRIBUTION_STATUS[status] ?? status;
}

const LINK_STATUS: Record<string, string> = {
  OK: "Links reachable",
  UNREACHABLE: "A link could not be reached",
  NOT_CHECKED: "Links not checked",
};

export function linkStatusLabel(status: string) {
  return LINK_STATUS[status] ?? status;
}

export function linkStatusTone(status: string): "pass" | "fail" | "neutral" {
  if (status === "OK") return "pass";
  if (status === "UNREACHABLE") return "fail";
  return "neutral";
}

export const REVIEW_REASON_OPTIONS = [
  { id: "OFF_TOPIC", label: "Off topic" },
  { id: "LOW_QUALITY", label: "Low quality" },
  { id: "DUPLICATE", label: "Duplicate" },
  { id: "BROKEN_LINK", label: "Broken link" },
  { id: "UNDISCLOSED_PROMOTION", label: "Undisclosed promotion" },
  { id: "INACCURATE", label: "Inaccurate" },
  { id: "OTHER", label: "Other" },
] as const;

const REVIEW_DECISIONS: Record<string, string> = {
  APPROVE: "Approve",
  REQUEST_CHANGES: "Request changes",
  CLOSE: "Close",
};

export function reviewDecisionLabel(decision: string) {
  return REVIEW_DECISIONS[decision] ?? decision;
}

export function reviewReasonLabel(reason: string) {
  return REVIEW_REASON_OPTIONS.find((item) => item.id === reason)?.label ?? reason;
}

/** What the author reads next to a decision. */
const REVIEW_REASON_SENTENCES: Record<string, string> = {
  OFF_TOPIC: "It does not fit this niche.",
  LOW_QUALITY: "It needs more depth or clarity before it helps a learner.",
  DUPLICATE: "Something very similar is already in this niche or its roadmap.",
  BROKEN_LINK: "A link did not work when the reviewer checked it.",
  UNDISCLOSED_PROMOTION: "It promotes something without saying so in the disclosure.",
  INACCURATE: "Part of it is not correct.",
  OTHER: "The reviewer explains it in the note.",
};

export function reviewReasonSentence(reason: string) {
  return REVIEW_REASON_SENTENCES[reason] ?? reviewReasonLabel(reason);
}

/** "Unmerged" for a maintainer close of a merged contribution, otherwise the decision. */
export function reviewEventLabel(decision: string, unmerge: boolean) {
  return unmerge ? "Unmerged" : reviewDecisionLabel(decision);
}

export function communityRoleLabel(role: string) {
  return role === "MAINTAINER" ? "Maintainer" : "Reviewer";
}

export const CONTRIBUTION_STATUSES = [
  { id: "OPEN", label: "Open" },
  { id: "CHANGES_REQUESTED", label: "Changes requested" },
  { id: "MERGED", label: "Merged" },
  { id: "CLOSED", label: "Closed" },
] as const;

export function contributionStatusTone(status: string): "pass" | "warn" | "fail" | "neutral" {
  if (status === "MERGED") return "pass";
  if (status === "CHANGES_REQUESTED") return "warn";
  if (status === "CLOSED") return "fail";
  return "neutral";
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}
