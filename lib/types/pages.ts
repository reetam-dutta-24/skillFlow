import type {
  ExplainBackPromptView,
  LeaderboardRowView,
  MasteryPointView,
  NotificationView,
  ResourceView,
  RoadmapStageView,
  SkillStatus,
  SkillView,
  SubmissionView,
  WeakTopicView,
} from "@/lib/types/domain";

export type LessonLaneStatus = "done" | "current" | "ready" | "milestone_check" | "locked";

export type LessonLaneItem = {
  id: string;
  title: string;
  status: LessonLaneStatus;
  href: string;
  mastery?: number;
};

export type DashboardSkillRow = {
  skill: SkillView;
  stagePosition: string;
  stageTitle: string;
  roadmapHref: string;
  lane: LessonLaneItem[];
};

export type DashboardData = {
  currentStreak: number;
  longestStreak: number;
  skillsInProgress: number;
  milestonesPassedThisWeek: number;
  explainBacksPassed: number;
  nextLesson: { title: string; skillName: string; href: string } | null;
  followed: DashboardSkillRow[];
  catalog: SkillView[];
};

export type ClipFormat = "short" | "video";

export type ClipFeedSkill = {
  slug: string;
  name: string;
  image: string;
  status: SkillStatus;
  followed: boolean;
  order: number;
};

export type ClipItem = {
  id: string;
  skillSlug: string;
  skillName: string;
  stageTitle: string;
  title: string;
  description: string | null;
  keyPoints: string[];
  url: string;
  format: ClipFormat;
  media: "embed" | "file";
  attributionHref: string;
  attributionLabel: string;
};

export type ClipFeedData = {
  skills: ClipFeedSkill[];
  clips: ClipItem[];
};

export type RoadmapIndexCard = {
  skill: SkillView;
  stagePosition: string;
  stageTitle: string;
  continueHref: string;
};

export type RoadmapIndexData = {
  followed: RoadmapIndexCard[];
  availableToAdd: SkillView[];
};

export type RoadmapDetailData = {
  skill: SkillView;
  stages: RoadmapStageView[];
  currentPosition: string;
};

export type LessonData =
  | {
      kind: "locked";
      skillSlug: string;
      skillName: string;
      stageTitle: string;
      previousStageTitle: string | null;
    }
  | {
      kind: "open";
      skill: SkillView;
      stage: RoadmapStageView;
      resources: ResourceView[];
    };

export type MilestoneData =
  | { kind: "locked"; skillSlug: string }
  | {
      kind: "passed";
      skill: SkillView;
      stage: RoadmapStageView;
      prompt: ExplainBackPromptView;
      acceptedExplanation: string;
      continueHref: string;
    }
  | {
      kind: "open";
      skill: SkillView;
      stage: RoadmapStageView;
      prompt: ExplainBackPromptView;
      passedSampleFeedback: string;
      needsWorkFeedback: string;
      followUpQuestion: string;
      followUpQuote: string;
      continueHref: string;
      continueLabel: string;
    };

export type ExplainReview =
  | { ok: true; kind: "follow-up"; question: string; quote: string }
  | { ok: true; kind: "pass"; feedback: string }
  | { ok: true; kind: "needs-improvement"; feedback: string }
  | { ok: false; error: "unavailable" | "empty" };

export type ProgressData = {
  currentStreak: number;
  longestStreak: number;
  skillsInProgress: number;
  milestonesPassedThisWeek: number;
  explainBacksPassed: number;
  skills: { skill: SkillView; points: MasteryPointView[] }[];
  weakTopics: WeakTopicView[];
};

export type SettingsData = {
  name: string | null;
  email: string | null;
  image: string | null;
  followed: SkillView[];
  availableToAdd: SkillView[];
  streakReminder: boolean;
};

export type NotificationsData = {
  items: NotificationView[];
};

export type SubmissionsData = {
  items: SubmissionView[];
};

export type UpgradeData = {
  priceLabel: string;
  isPremium: boolean;
};

export type LeaderboardData = {
  rows: LeaderboardRowView[];
  optedOut: boolean;
};

export type TranscriptData = {
  learnerName: string;
  skill: SkillView;
  milestones: {
    stageId: string;
    title: string;
    explainBackPassedOn: string;
  }[];
};

export type NotesData = {
  notes: {
    id: string;
    skillSlug: string;
    skillName: string;
    stageId: string;
    stageTitle: string;
    title: string;
    body: string;
    updatedAt: string;
  }[];
};

export type ProjectReviewData = {
  stageTitle: string;
  skillName: string;
  waitingForPeer: boolean;
};

export type CreatorData = {
  status: "not_applied" | "pending" | "verified";
};

export type ByorData = {
  unsupportedUrl: string;
};
