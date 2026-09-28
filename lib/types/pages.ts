import type {
  ExplainBackPromptView,
  LeaderboardRowView,
  MasteryPointView,
  NotificationView,
  QuizView,
  ResourceView,
  RoadmapStageView,
  SkillView,
  SubmissionView,
  WeakTopicView,
} from "@/lib/types/domain";

export type LessonLaneStatus = "done" | "current" | "quiz" | "milestone_check" | "locked";

export type LessonLaneItem = {
  id: string;
  title: string;
  status: LessonLaneStatus;
  href: string;
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
  quizzesCompleted: number;
  nextLesson: { title: string; skillName: string; href: string } | null;
  followed: DashboardSkillRow[];
  catalog: SkillView[];
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
      previousStageTitle: string | null;
    }
  | {
      kind: "open";
      skill: SkillView;
      stage: RoadmapStageView;
      resources: ResourceView[];
      quizHref: string;
    };

export type QuizData =
  | { kind: "unavailable" }
  | { kind: "locked"; skillSlug: string }
  | { kind: "ready"; skill: SkillView; stage: RoadmapStageView; quiz: QuizView };

export type MilestoneData =
  | { kind: "locked"; skillSlug: string }
  | { kind: "quiz_required"; quizHref: string; skillName: string; stageTitle: string }
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
    };

export type ProgressData = {
  currentStreak: number;
  longestStreak: number;
  skillsInProgress: number;
  milestonesPassedThisWeek: number;
  quizzesCompleted: number;
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
    quizPassedOn: string;
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
