import * as React from "react";

/**
 * Weak-topic flags on the Progress dashboard. New in SkillFlow — the closest
 * AniVerse analogue was the taste-breakdown panel, which ranked preferences
 * rather than flagging gaps.
 */
export interface WeakTopic {
  id?: string;
  topic: string;
  skill: string;
  detail?: string;
  accuracy: number;
  severity?: "high" | "medium";
}
export interface WeakTopicListProps extends React.HTMLAttributes<HTMLUListElement> {
  topics?: WeakTopic[];
  onReview?: (topic: WeakTopic) => void;
}
export function WeakTopicList(props: WeakTopicListProps): React.JSX.Element;
