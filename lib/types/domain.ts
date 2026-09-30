/** View models for the authenticated app. Field names follow the Prisma models. Dates are ISO strings so they can cross into client components. */

export type UserRole = "USER" | "ADMIN";

export type SessionViewer = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
};

export type SkillStatus = "available" | "coming_soon";

export type StageStatus = "passed" | "in_progress" | "locked";

export type ResourceType = "HOOK_CLIP" | "EMBEDDED_VIDEO" | "DOC_LINK" | "COURSE_LINK";

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ExplainBackVerdict = "PASSED" | "NEEDS_IMPROVEMENT";

export type SkillView = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string;
  isFlagship: boolean;
  order: number;
  status: SkillStatus;
  followed: boolean;
  masteryPercent: number;
  createdAt: string;
};

export type ResourceView = {
  id: string;
  stageId: string;
  type: ResourceType;
  url: string;
  order: number;
  title: string;
  description: string | null;
  keyPoints: string[];
  transcript: string | null;
  /** Not stored on Resource. Set when the source is gone and only the snapshot remains. */
  unavailable: boolean;
};

export type RoadmapStageView = {
  id: string;
  skillId: string;
  title: string;
  description: string | null;
  order: number;
  status: StageStatus;
  masteryPercent: number;
  lessonCount: number;
  hasQuiz: boolean;
  hasExplainBack: boolean;
  quizPassed: boolean;
  explainBackPassed: boolean;
  previousStageTitle: string | null;
};

export type QuizOptionView = {
  id: string;
  label: string;
};

export type QuizQuestionView = {
  id: string;
  quizId: string;
  prompt: string;
  options: QuizOptionView[];
  correctOptionId: string;
  explanation: string;
  order: number;
  sourceTitle: string;
};

export type QuizView = {
  id: string;
  stageId: string;
  version: number;
  questions: QuizQuestionView[];
  createdAt: string;
};

export type ExplainBackPromptView = {
  id: string;
  stageId: string;
  version: number;
  question: string;
  rubric: string[];
};

export type ExplainBackSample = {
  verdict: ExplainBackVerdict;
  feedback: string;
  followUpQuestion: string;
  followUpQuote: string;
};

export type WeakTopicView = {
  id: string;
  topic: string;
  skillSlug: string;
  skillName: string;
  stageId: string;
  accuracy: number;
  reason: string;
};

export type MasteryPointView = {
  month: string;
  value: number;
};

export type NotificationView = {
  id: string;
  title: string;
  message: string;
  timeLabel: string;
  read: boolean;
};

export type SubmissionView = {
  id: string;
  stageId: string;
  skillName: string;
  stageTitle: string;
  type: ResourceType;
  url: string;
  title: string;
  description: string | null;
  status: SubmissionStatus;
  reviewNotes: string | null;
  reviewedAt: string | null;
  submittedById: string;
  submitterName: string;
  createdAt: string;
};

export type LeaderboardRowView = {
  rank: number;
  name: string;
  city: string | null;
  score: number;
  isViewer: boolean;
};
