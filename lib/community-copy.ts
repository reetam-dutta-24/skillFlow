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

const REVIEW_DECISIONS: Record<string, string> = {
  APPROVE: "Approve",
  REQUEST_CHANGES: "Request changes",
  CLOSE: "Close",
};

const REVIEW_REASONS: Record<string, string> = {
  OFF_TOPIC: "Off topic",
  LOW_QUALITY: "Low quality",
  DUPLICATE: "Duplicate",
  BROKEN_LINK: "Broken link",
  UNDISCLOSED_PROMOTION: "Undisclosed promotion",
  INACCURATE: "Inaccurate",
  OTHER: "Other",
};

export function reviewDecisionLabel(decision: string) {
  return REVIEW_DECISIONS[decision] ?? decision;
}

export function reviewReasonLabel(reason: string) {
  return REVIEW_REASONS[reason] ?? reason;
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}
