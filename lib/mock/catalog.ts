import "server-only";
import { YOUTUBE_PLACEHOLDER_ID } from "@/lib/mock/config";
import type {
  ExplainBackPromptView,
  ExplainBackSample,
  LeaderboardRowView,
  MasteryPointView,
  NotificationView,
  QuizView,
  ResourceType,
  ResourceView,
  RoadmapStageView,
  SkillView,
  StageStatus,
  SubmissionView,
  WeakTopicView,
} from "@/lib/types/domain";

const CREATED = "2026-04-01T00:00:00.000Z";

export const learnerStats = {
  currentStreak: 12,
  longestStreak: 21,
  milestonesPassedThisWeek: 3,
  quizzesCompleted: 28,
  skillsInProgress: 2,
};

/** Check-ins for the current week. Wednesday is the gap; Saturday is the busy day. */
export const habitWeek = [
  { day: "Mon", checks: 1 },
  { day: "Tue", checks: 2 },
  { day: "Wed", checks: 0 },
  { day: "Thu", checks: 1 },
  { day: "Fri", checks: 2 },
  { day: "Sat", checks: 3 },
  { day: "Sun", checks: 2 },
];

/** 22 + 6 = quizzesCompleted. Passed means the quiz threshold was met. */
export const quizOutcomes = { passed: 22, needsAnotherLook: 6 };

/** Explain-back outcomes. Retries are not penalties. */
export const explainOutcomes = { passed: 9, retried: 3 };

export const nextLesson = {
  stageId: "stage_fs_2",
  stageTitle: "Hooks & State",
  skillName: "Full-Stack Web Development",
  skillSlug: "full-stack-web-dev",
};

const skills: SkillView[] = [
  {
    id: "skill_fs",
    slug: "full-stack-web-dev",
    name: "Full-Stack Web Development",
    description: "React, server actions, auth, and a relational database.",
    isFlagship: true,
    order: 1,
    status: "available",
    followed: true,
    masteryPercent: 62,
    createdAt: CREATED,
  },
  {
    id: "skill_art",
    slug: "art-painting",
    name: "Art & Painting",
    description: "Value, color, perspective, and composition.",
    isFlagship: true,
    order: 2,
    status: "available",
    followed: true,
    masteryPercent: 28,
    createdAt: CREATED,
  },
  {
    id: "skill_content",
    slug: "content-creation",
    name: "Content Creation",
    description: "Structure, editing, and a repeatable publishing process.",
    isFlagship: true,
    order: 3,
    status: "available",
    followed: false,
    masteryPercent: 0,
    createdAt: CREATED,
  },
  {
    id: "skill_photo",
    slug: "photography",
    name: "Photography",
    description: null,
    isFlagship: false,
    order: 4,
    status: "coming_soon",
    followed: false,
    masteryPercent: 0,
    createdAt: CREATED,
  },
  {
    id: "skill_music",
    slug: "music-production",
    name: "Music Production",
    description: null,
    isFlagship: false,
    order: 5,
    status: "coming_soon",
    followed: false,
    masteryPercent: 0,
    createdAt: CREATED,
  },
];

type StageSeed = {
  id: string;
  skillId: string;
  title: string;
  description: string;
  order: number;
  status: StageStatus;
  masteryPercent: number;
  quizPassed: boolean;
  explainBackPassed: boolean;
};

const stageSeeds: StageSeed[] = [
  { id: "stage_fs_1", skillId: "skill_fs", title: "React Fundamentals", description: "Components, props, and the render model.", order: 1, status: "passed", masteryPercent: 100, quizPassed: true, explainBackPassed: true },
  { id: "stage_fs_2", skillId: "skill_fs", title: "Hooks & State", description: "State, effects, and the dependency array.", order: 2, status: "in_progress", masteryPercent: 48, quizPassed: false, explainBackPassed: false },
  { id: "stage_fs_3", skillId: "skill_fs", title: "Server Actions", description: "Mutating data without writing API routes.", order: 3, status: "locked", masteryPercent: 0, quizPassed: false, explainBackPassed: false },
  { id: "stage_fs_4", skillId: "skill_fs", title: "Auth & Sessions", description: "Protecting routes and managing identity.", order: 4, status: "locked", masteryPercent: 0, quizPassed: false, explainBackPassed: false },
  { id: "stage_fs_5", skillId: "skill_fs", title: "Database & Prisma", description: "Modeling and querying relational data.", order: 5, status: "locked", masteryPercent: 0, quizPassed: false, explainBackPassed: false },
  { id: "stage_art_1", skillId: "skill_art", title: "Value & Form", description: "Light, shadow, and how a form turns in space.", order: 1, status: "in_progress", masteryPercent: 28, quizPassed: false, explainBackPassed: false },
  { id: "stage_art_2", skillId: "skill_art", title: "Color Theory", description: "Hue, value, and temperature in a limited palette.", order: 2, status: "locked", masteryPercent: 0, quizPassed: false, explainBackPassed: false },
  { id: "stage_art_3", skillId: "skill_art", title: "Perspective", description: "One- and two-point perspective for solid objects.", order: 3, status: "locked", masteryPercent: 0, quizPassed: false, explainBackPassed: false },
  { id: "stage_art_4", skillId: "skill_art", title: "Anatomy & Proportion", description: "Landmarks and proportions for a standing figure.", order: 4, status: "locked", masteryPercent: 0, quizPassed: false, explainBackPassed: false },
  { id: "stage_art_5", skillId: "skill_art", title: "Composition", description: "Placing the subject so the eye knows where to rest.", order: 5, status: "locked", masteryPercent: 0, quizPassed: false, explainBackPassed: false },
];

function resource(
  id: string,
  stageId: string,
  order: number,
  type: ResourceType,
  title: string,
  description: string,
  keyPoints: string,
  url: string,
  unavailable = false,
): ResourceView {
  return {
    id,
    stageId,
    type,
    url,
    order,
    title,
    description,
    keyPoints,
    transcript: null,
    unavailable,
  };
}

const videoUrl = `https://www.youtube-nocookie.com/embed/${YOUTUBE_PLACEHOLDER_ID}`;

const resources: ResourceView[] = [
  resource("res_fs_1a", "stage_fs_1", 1, "DOC_LINK", "Your first component", "How a component returns elements and why that function runs again on each render.", "A component is a function. It returns UI. React calls it when state or props change.", "https://react.dev/learn/your-first-component"),
  resource("res_fs_1b", "stage_fs_1", 2, "DOC_LINK", "Passing props", "How a parent passes data into a child, and why props are read-only.", "Props flow down. The child does not change them. Rendering is a snapshot of the current props.", "https://react.dev/learn/passing-props-to-a-component"),
  resource("res_fs_1c", "stage_fs_1", 3, "EMBEDDED_VIDEO", "Render model, in short", "A short walk through what happens between a state update and the next screen.", "State update, render, commit. The screen is the result of the latest render.", videoUrl),
  resource("res_fs_1d", "stage_fs_1", 4, "COURSE_LINK", "Quick start", "The official starting path, from a component to a small interactive page.", "Start with components, then state, then responding to input.", "https://react.dev/learn"),
  resource("res_fs_2a", "stage_fs_2", 1, "DOC_LINK", "useState", "How state remembers a value between renders, and what a setter actually does.", "Calling the setter schedules a new render. The current render still sees the old value.", "https://react.dev/reference/react/useState"),
  resource("res_fs_2b", "stage_fs_2", 2, "DOC_LINK", "useEffect", "When an effect runs, and what the dependency array is for.", "The array lists values the effect closes over. React skips the effect when those values are unchanged.", "https://react.dev/reference/react/useEffect"),
  resource("res_fs_2c", "stage_fs_2", 3, "HOOK_CLIP", "Effects and dependencies", "A short clip on why an effect without a dependency list runs after every paint.", "No array: every commit. Empty array: after the first paint. Values in the array: when those values change.", videoUrl),
  resource("res_fs_2d", "stage_fs_2", 4, "DOC_LINK", "Older hooks article", "A third-party writeup that is no longer online. The snapshot below is what it covered.", "Cleanup runs before the next effect and when the component unmounts. Stale closures come from omitting a dependency.", "https://react.dev/reference/react/useEffect", true),
  resource("res_fs_3a", "stage_fs_3", 1, "DOC_LINK", "Server functions", "Calling a function on the server from a component, without a hand-written route.", "The function runs on the server. The client sends the arguments. The result comes back as data.", "https://react.dev/reference/rsc/server-functions"),
  resource("res_fs_3b", "stage_fs_3", 2, "DOC_LINK", "Forms and actions", "How a form submits to a server function and how pending state is shown.", "Pass the action to the form. Keep the form usable again if the action fails.", "https://react.dev/reference/react-dom/components/form"),
  resource("res_fs_3c", "stage_fs_3", 3, "COURSE_LINK", "Server actions guide", "The Next.js guide for mutating data from a form.", "Validate on the server. Return a result the form can show. Do not trust the client.", "https://nextjs.org/docs/app/getting-started/mutating-data"),
  resource("res_fs_4a", "stage_fs_4", 1, "DOC_LINK", "Auth.js session", "How a session is read on the server and why a protected page checks it itself.", "Middleware is one gate. The page checks the session again before it reads private data.", "https://authjs.dev/getting-started/session-management/protecting"),
  resource("res_fs_4b", "stage_fs_4", 2, "DOC_LINK", "Credentials and OAuth", "The difference between a password account and a provider account.", "A password is stored as a hash. An OAuth account stores the provider id, not the password.", "https://authjs.dev/getting-started/authentication/oauth"),
  resource("res_fs_4c", "stage_fs_4", 3, "EMBEDDED_VIDEO", "What a session cookie is", "A short explanation of a signed cookie and why the browser sends it back.", "The cookie identifies the session. It is not the user's password.", videoUrl),
  resource("res_fs_5a", "stage_fs_5", 1, "DOC_LINK", "Prisma models", "How a model becomes a table, and what a relation field means.", "A model is a table. A relation is a foreign key. The client is generated from the schema.", "https://www.prisma.io/docs/orm/prisma-schema/data-model/models"),
  resource("res_fs_5b", "stage_fs_5", 2, "DOC_LINK", "Queries", "Finding one row, filtering, and including a relation without a second round trip.", "findUnique for one row. include to load a relation in the same query.", "https://www.prisma.io/docs/orm/prisma-client/queries/crud"),
  resource("res_fs_5c", "stage_fs_5", 3, "COURSE_LINK", "Migrations", "Why a migration file is kept, and what it records.", "A migration is the history of the schema. Apply it instead of editing the database by hand.", "https://www.prisma.io/docs/orm/prisma-migrate"),
  resource("res_art_1a", "stage_art_1", 1, "DOC_LINK", "Value before color", "Why a form has to read clearly in grayscale before hue is added.", "Value separates the planes. Color cannot fix a form that collapses into one tone.", "https://www.metmuseum.org/essays/the-art-of-drawing"),
  resource("res_art_1b", "stage_art_1", 2, "EMBEDDED_VIDEO", "Turning a simple form", "A short study of a sphere and a box under one light.", "One light. A light plane, a mid plane, and a shadow. The cast shadow sits on another surface.", videoUrl),
  resource("res_art_1c", "stage_art_1", 3, "COURSE_LINK", "Observational drawing notes", "A museum primer on looking at form rather than outlining it.", "Draw the planes you see. Check the big shape before the details.", "https://www.metmuseum.org/essays/the-art-of-drawing"),
  resource("res_art_2a", "stage_art_2", 1, "DOC_LINK", "Warm and cool", "How temperature shifts a color without changing its name.", "A red can be warm or cool. Temperature is relative to the color next to it.", "https://www.metmuseum.org/essays/color-in-western-art"),
  resource("res_art_2b", "stage_art_2", 2, "DOC_LINK", "Limited palette", "Choosing a few colors and mixing the rest.", "A small palette keeps the picture consistent. Mix rather than reaching for a new tube.", "https://www.metmuseum.org/essays/color-in-western-art"),
  resource("res_art_2c", "stage_art_2", 3, "EMBEDDED_VIDEO", "A three-color study", "Mixing a light, a shadow, and a neutral from three paints.", "The shadow is not black. It is the local color shifted cooler and darker.", videoUrl),
  resource("res_art_3a", "stage_art_3", 1, "DOC_LINK", "One-point perspective", "How parallel edges meet at a single vanishing point.", "The horizon is eye level. Edges that recede meet at one point on that line.", "https://www.metmuseum.org/essays/the-art-of-drawing"),
  resource("res_art_3b", "stage_art_3", 2, "DOC_LINK", "Two-point perspective", "Turning a box so neither face is parallel to the picture plane.", "Two vanishing points sit on the horizon. Vertical edges stay vertical.", "https://www.metmuseum.org/essays/the-art-of-drawing"),
  resource("res_art_3c", "stage_art_3", 3, "EMBEDDED_VIDEO", "Drawing a room", "A short construction of a room in one-point perspective.", "Start with the back wall. Then the floor lines. Check that they meet.", videoUrl),
  resource("res_art_4a", "stage_art_4", 1, "DOC_LINK", "Landmarks", "The handful of points that locate a standing figure.", "Head, shoulders, pelvis, knees. Place these before drawing the outline.", "https://www.metmuseum.org/essays/the-art-of-drawing"),
  resource("res_art_4b", "stage_art_4", 2, "DOC_LINK", "Proportion", "Comparing the head height to the rest of the figure.", "Use the head as a unit. Check the total height against it before adding detail.", "https://www.metmuseum.org/essays/the-art-of-drawing"),
  resource("res_art_4c", "stage_art_4", 3, "COURSE_LINK", "Figure drawing notes", "A museum primer on looking at the figure as a set of masses.", "See the ribcage and pelvis as two boxes. The spine connects them.", "https://www.metmuseum.org/essays/the-art-of-drawing"),
  resource("res_art_5a", "stage_art_5", 1, "DOC_LINK", "Where the eye rests", "Choosing one clear place for the subject.", "One dominant shape. The other shapes support it. Do not give every corner the same weight.", "https://www.metmuseum.org/essays/the-art-of-drawing"),
  resource("res_art_5b", "stage_art_5", 2, "DOC_LINK", "Cropping", "Deciding what stays outside the frame.", "Crop when the edge makes the pose clearer. Leave space in front of a gaze.", "https://www.metmuseum.org/essays/the-art-of-drawing"),
  resource("res_art_5c", "stage_art_5", 3, "EMBEDDED_VIDEO", "Three thumbnails", "Testing three placements of the same subject.", "Draw the big shape three times. Keep the one where the subject is obvious at a glance.", videoUrl),
];

function stagesFor(skillId: string): RoadmapStageView[] {
  const seeds = stageSeeds.filter((stage) => stage.skillId === skillId).sort((a, b) => a.order - b.order);
  return seeds.map((stage, index) => ({
    id: stage.id,
    skillId: stage.skillId,
    title: stage.title,
    description: stage.description,
    order: stage.order,
    status: stage.status,
    masteryPercent: stage.masteryPercent,
    lessonCount: resources.filter((item) => item.stageId === stage.id).length,
    hasQuiz: true,
    hasExplainBack: true,
    quizPassed: stage.quizPassed,
    explainBackPassed: stage.explainBackPassed,
    previousStageTitle: index > 0 ? seeds[index - 1].title : null,
  }));
}

const hooksQuiz: QuizView = {
  id: "quiz_fs_2",
  stageId: "stage_fs_2",
  version: 1,
  createdAt: CREATED,
  questions: [
    {
      id: "q1",
      quizId: "quiz_fs_2",
      order: 1,
      prompt: "What does calling a state setter do during the current render?",
      sourceTitle: "useState",
      correctOptionId: "q1b",
      explanation: "From the useState page: the setter schedules a new render. The render that is already running still sees the old value.",
      options: [
        { id: "q1a", label: "It changes the variable immediately, so the rest of this render sees the new value." },
        { id: "q1b", label: "It schedules another render. This render still sees the old value." },
        { id: "q1c", label: "It writes the value to the database before the function returns." },
        { id: "q1d", label: "It skips the next render if the component has already painted." },
      ],
    },
    {
      id: "q2",
      quizId: "quiz_fs_2",
      order: 2,
      prompt: "Why does useEffect take a dependency array?",
      sourceTitle: "useEffect",
      correctOptionId: "q2a",
      explanation: "From the useEffect page: the array lists the values the effect closes over, so React can skip the effect when they have not changed.",
      options: [
        { id: "q2a", label: "So React can re-run the effect only when those values change." },
        { id: "q2b", label: "So the effect is allowed to update the DOM during render." },
        { id: "q2c", label: "So React can store the effect's return value as state." },
        { id: "q2d", label: "So the effect runs once per dependency, in parallel." },
      ],
    },
    {
      id: "q3",
      quizId: "quiz_fs_2",
      order: 3,
      prompt: "When does an effect with an empty dependency array run?",
      sourceTitle: "useEffect",
      correctOptionId: "q3c",
      explanation: "An empty array means none of the values are expected to change, so the effect runs after the first paint and not on later updates.",
      options: [
        { id: "q3a", label: "After every paint." },
        { id: "q3b", label: "During render, before the browser paints." },
        { id: "q3c", label: "After the first paint only." },
        { id: "q3d", label: "Only when the component unmounts." },
      ],
    },
    {
      id: "q4",
      quizId: "quiz_fs_2",
      order: 4,
      prompt: "What is the cleanup function for?",
      sourceTitle: "useEffect",
      correctOptionId: "q4d",
      explanation: "Cleanup runs before the effect runs again and when the component unmounts, so a subscription or timer from the previous run does not linger.",
      options: [
        { id: "q4a", label: "To reset state back to its initial value." },
        { id: "q4b", label: "To cancel the render that is currently in progress." },
        { id: "q4c", label: "To skip the dependency array on the next update." },
        { id: "q4d", label: "To stop work from the previous effect before the next one starts, and on unmount." },
      ],
    },
    {
      id: "q5",
      quizId: "quiz_fs_2",
      order: 5,
      prompt: "What goes wrong if an effect uses a value that is missing from its dependency array?",
      sourceTitle: "useEffect",
      correctOptionId: "q5b",
      explanation: "The effect keeps the value from the render that created it. Later renders change that value, but the effect still sees the old one.",
      options: [
        { id: "q5a", label: "React refuses to render the component." },
        { id: "q5b", label: "The effect can keep seeing an older value from a previous render." },
        { id: "q5c", label: "The dependency array is ignored and the effect runs twice as often." },
        { id: "q5d", label: "The missing value is read from local storage instead." },
      ],
    },
  ],
};

const explainPrompts: ExplainBackPromptView[] = [
  {
    id: "exp_fs_1",
    stageId: "stage_fs_1",
    version: 1,
    question: "In your own words, what is a render?",
    rubric: "A complete answer says a render is React calling the component to read the current props and state and describe the UI. It is not the same as painting pixels.",
  },
  {
    id: "exp_fs_2",
    stageId: "stage_fs_2",
    version: 1,
    question: "Why does useEffect need a dependency array?",
    rubric: "A complete answer says the array tells React which values the effect closes over, so React can skip the effect when those values have not changed and re-run it when they have. An empty array runs after the first paint only. Omitting the array runs after every paint.",
  },
];

export const explainSamples: Record<string, ExplainBackSample> = {
  stage_fs_2: {
    verdict: "PASSED",
    feedback: "You covered the point of the array: React uses it to decide whether the effect still matches the latest render. You also separated an empty array from leaving the array off.",
    followUpQuestion: "You wrote that the array lists what the effect uses. What should happen when one of those values changes?",
    followUpQuote: "the array lists what the effect uses",
  },
};

export const explainNeedsWork: ExplainBackSample = {
  verdict: "NEEDS_IMPROVEMENT",
  feedback: "You said the array stops the effect from looping. That is close, and it misses the actual rule: the array is the list of values the effect should re-run for. There is no penalty for another try.",
  followUpQuestion: "Which values belong in the array if the effect reads a prop named userId?",
  followUpQuote: "stops the effect from looping",
};

export const acceptedExplanations: Record<string, string> = {
  stage_fs_1: "A render is React calling my component with the current props and state so it can describe the UI. Painting the screen happens after that.",
};

const weakTopics: WeakTopicView[] = [
  {
    id: "weak_effect_cleanup",
    topic: "useEffect cleanup",
    skillSlug: "full-stack-web-dev",
    skillName: "Full-Stack Web Development",
    stageId: "stage_fs_2",
    accuracy: 0.42,
    reason: "3 misses in 2 quizzes",
  },
  {
    id: "weak_color_temp",
    topic: "Colour temperature",
    skillSlug: "art-painting",
    skillName: "Art & Painting",
    stageId: "stage_art_2",
    accuracy: 0.64,
    reason: "Explain-back retried once",
  },
];

const masteryHistory: { skillSlug: string; points: MasteryPointView[] }[] = [
  {
    skillSlug: "full-stack-web-dev",
    points: [
      { month: "Apr", value: 18 },
      { month: "May", value: 27 },
      { month: "Jun", value: 36 },
      { month: "Jul", value: 44 },
      { month: "Aug", value: 53 },
      { month: "Sep", value: 62 },
    ],
  },
  {
    skillSlug: "art-painting",
    points: [
      { month: "Apr", value: 4 },
      { month: "May", value: 8 },
      { month: "Jun", value: 12 },
      { month: "Jul", value: 17 },
      { month: "Aug", value: 22 },
      { month: "Sep", value: 28 },
    ],
  },
];

const notifications: NotificationView[] = [
  {
    id: "note_approved",
    title: "Your suggested resource was approved",
    message: "“Your first component” is on the React Fundamentals stage.",
    timeLabel: "Yesterday",
    read: false,
  },
  {
    id: "note_changes",
    title: "Your suggested resource needs changes",
    message: "The review note: this link is a news article, not a lesson. Send a documentation page instead.",
    timeLabel: "3 days ago",
    read: false,
  },
];

type SubmissionSeed = Omit<SubmissionView, "submittedById" | "submitterName">;

const submissionSeeds: SubmissionSeed[] = [
  { id: "sub_1", stageId: "stage_fs_2", skillName: "Full-Stack Web Development", stageTitle: "Hooks & State", type: "DOC_LINK", url: "https://react.dev/learn/state-a-components-memory", title: "State as a component's memory", description: "The React page on why state is tied to a position in the tree.", status: "PENDING", reviewNotes: null, reviewedAt: null, createdAt: "2026-09-20T00:00:00.000Z" },
  { id: "sub_2", stageId: "stage_fs_2", skillName: "Full-Stack Web Development", stageTitle: "Hooks & State", type: "DOC_LINK", url: "https://react.dev/learn/synchronizing-with-effects", title: "Synchronizing with effects", description: "When an effect is the right tool, and when it is not.", status: "PENDING", reviewNotes: null, reviewedAt: null, createdAt: "2026-09-21T00:00:00.000Z" },
  { id: "sub_3", stageId: "stage_art_1", skillName: "Art & Painting", stageTitle: "Value & Form", type: "COURSE_LINK", url: "https://www.metmuseum.org/essays/the-art-of-drawing", title: "The art of drawing", description: "A museum essay on looking at form.", status: "PENDING", reviewNotes: null, reviewedAt: null, createdAt: "2026-09-22T00:00:00.000Z" },
  { id: "sub_4", stageId: "stage_fs_1", skillName: "Full-Stack Web Development", stageTitle: "React Fundamentals", type: "EMBEDDED_VIDEO", url: "https://www.youtube-nocookie.com/embed/skillflow-placeholder", title: "A short render walkthrough", description: "A clip that stays on the render and commit steps.", status: "PENDING", reviewNotes: null, reviewedAt: null, createdAt: "2026-09-23T00:00:00.000Z" },
  { id: "sub_5", stageId: "stage_fs_1", skillName: "Full-Stack Web Development", stageTitle: "React Fundamentals", type: "DOC_LINK", url: "https://react.dev/learn/your-first-component", title: "Your first component", description: "Official page on writing a component.", status: "APPROVED", reviewNotes: null, reviewedAt: "2026-09-18T00:00:00.000Z", createdAt: "2026-09-16T00:00:00.000Z" },
  { id: "sub_6", stageId: "stage_art_1", skillName: "Art & Painting", stageTitle: "Value & Form", type: "DOC_LINK", url: "https://www.metmuseum.org/essays/the-art-of-drawing", title: "Seeing planes of light", description: "Notes on separating light and shadow before adding detail.", status: "APPROVED", reviewNotes: null, reviewedAt: "2026-09-12T00:00:00.000Z", createdAt: "2026-09-10T00:00:00.000Z" },
  { id: "sub_7", stageId: "stage_fs_2", skillName: "Full-Stack Web Development", stageTitle: "Hooks & State", type: "DOC_LINK", url: "https://example.com/hooks-news", title: "Hooks, explained by a news desk", description: "A news recap of a conference talk.", status: "REJECTED", reviewNotes: "This link is a news article, not a lesson. Send a documentation page instead.", reviewedAt: "2026-09-15T00:00:00.000Z", createdAt: "2026-09-14T00:00:00.000Z" },
];

const leaderboardOthers: { name: string; city: string | null; score: number }[] = [
  { name: "Avery Lang", city: "Lisbon", score: 91 },
  { name: "Mina Cho", city: "Seoul", score: 88 },
  { name: "Jules Ortega", city: null, score: 84 },
  { name: "Placeholder Learner", city: null, score: 81 },
  { name: "Samir Adeyemi", city: "Lagos", score: 79 },
  { name: "Priya Nair", city: "Pune", score: 74 },
  { name: "Leo Marin", city: null, score: 71 },
  { name: "Hana Sato", city: "Osaka", score: 66 },
  { name: "Owen Blake", city: "Leeds", score: 61 },
  { name: "Noor Haddad", city: "Amman", score: 55 },
];

export function listSkills() {
  return skills.map((skill) => ({ ...skill }));
}

export function findSkill(slug: string) {
  return listSkills().find((skill) => skill.slug === slug) ?? null;
}

export function findSkillById(id: string) {
  return listSkills().find((skill) => skill.id === id) ?? null;
}

export function listStages(skillId: string) {
  return stagesFor(skillId);
}

export function findStage(stageId: string) {
  const seed = stageSeeds.find((stage) => stage.id === stageId);
  if (!seed) return null;
  const skill = findSkillById(seed.skillId);
  if (!skill) return null;
  const stage = stagesFor(seed.skillId).find((item) => item.id === stageId);
  if (!stage) return null;
  return { skill, stage };
}

export function listResources(stageId: string) {
  return resources
    .filter((item) => item.stageId === stageId)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ ...item }));
}

export function findQuiz(stageId: string) {
  if (stageId !== hooksQuiz.stageId) return null;
  return {
    ...hooksQuiz,
    questions: hooksQuiz.questions.map((question) => ({
      ...question,
      options: question.options.map((option) => ({ ...option })),
    })),
  };
}

export function findExplainPrompt(stageId: string) {
  return explainPrompts.find((prompt) => prompt.stageId === stageId) ?? null;
}

export function listWeakTopics() {
  return weakTopics.map((topic) => ({ ...topic }));
}

export function listMasteryHistory() {
  return masteryHistory.map((series) => ({
    skillSlug: series.skillSlug,
    points: series.points.map((point) => ({ ...point })),
  }));
}

export function listNotifications() {
  return notifications.map((item) => ({ ...item }));
}

const adminNames = ["Avery Lang", "Mina Cho", "Jules Ortega", "Samir Adeyemi", "Priya Nair", "Leo Marin", "Hana Sato"];

export function listAdminQueue(): SubmissionView[] {
  return submissionSeeds.map((item, index) => ({
    ...item,
    submittedById: `learner_${index}`,
    submitterName: adminNames[index] ?? "Learner",
  }));
}

export function listSubmissions(viewer: { id: string; name: string | null }): SubmissionView[] {
  const submitterName = viewer.name?.trim() || "You";
  return submissionSeeds.map((item) => ({
    ...item,
    submittedById: viewer.id,
    submitterName,
  }));
}

export function leaderboardWithViewer(viewer: { name: string | null }): LeaderboardRowView[] {
  return leaderboardOthers.map((row, index) => {
    const isViewer = index === 3;
    return {
      rank: index + 1,
      name: isViewer ? viewer.name?.trim() || "You" : row.name,
      city: isViewer ? null : row.city,
      score: row.score,
      isViewer,
    };
  });
}

export const passedMilestone = {
  stageId: "stage_fs_1",
  skillSlug: "full-stack-web-dev",
  title: "React Fundamentals",
  quizPassedOn: "2026-08-02",
  explainBackPassedOn: "2026-08-04",
};

export const noteSeeds = [
  {
    id: "note_body_1",
    skillSlug: "full-stack-web-dev",
    skillName: "Full-Stack Web Development",
    stageId: "stage_fs_2",
    stageTitle: "Hooks & State",
    title: "Dependency array",
    body: "The array is the list of values the effect should re-run for. Empty means after the first paint only.",
    updatedAt: "2026-09-18T00:00:00.000Z",
  },
];
