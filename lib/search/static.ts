import type { SearchEntry } from "./score";

/**
 * Everything in SkillFlow that is not catalog content: pages, features, settings, quick actions, and help. Searched in
 * the browser, so these results appear instantly. Add an entry when a page or a feature ships.
 */
export const STATIC_SEARCH: readonly SearchEntry[] = [
  // Pages
  { id: "p-home", kind: "page", title: "Home", description: "Your next stage, streak, and everything at a glance", href: "/dashboard", icon: "house", keywords: ["dashboard", "start", "overview", "continue"] },
  { id: "p-niches", kind: "page", title: "Niches", description: "Browse every subject; thirty paths are free", href: "/skills", icon: "library", keywords: ["skills", "subjects", "browse", "catalog", "follow", "free paths", "topics"] },
  { id: "p-paths", kind: "page", title: "Paths", description: "Your followed paths, stage by stage", href: "/roadmap", icon: "route", keywords: ["roadmap", "stages", "learning path", "plan"] },
  { id: "p-clips", kind: "page", title: "Clips", description: "A feed of short lessons from every niche", href: "/clips", icon: "clapperboard", keywords: ["videos", "reels", "shorts", "feed", "watch"] },
  { id: "p-notes", kind: "page", title: "Notes", description: "Every idea you explained well, with its review", href: "/notes", icon: "notebook-pen", keywords: ["my notes", "export", "word", "pdf", "summary", "recall"] },
  { id: "p-practice", kind: "page", title: "Practice notes", description: "Explain an idea from a link, a file, or pasted text", href: "/notes/practice", icon: "flask-conical", keywords: ["practice", "own material", "paste", "upload", "article"] },
  { id: "p-progress", kind: "page", title: "Progress", description: "Mastery, streaks, retention, transcripts, and certificates", href: "/progress", icon: "chart-line", keywords: ["mastery", "streak", "retention", "records", "transcript", "certificate"] },
  { id: "p-analytics", kind: "page", title: "Analytics", description: "Your activity in charts", href: "/analytics", icon: "chart-pie", keywords: ["charts", "stats", "statistics", "insights", "timeline"] },
  { id: "p-detox", kind: "page", title: "Dopamine Detox", description: "Your Detox Score, check-ins, and focus sessions", href: "/detox", icon: "leaf", keywords: ["detox", "screen time", "focus", "dopamine", "digital wellbeing", "phone", "scrolling"] },
  { id: "p-detox-check", kind: "page", title: "Detox self-check", description: "Twenty quick questions for your starting score", href: "/detox/check", icon: "leaf", keywords: ["detox test", "quiz", "baseline", "questionnaire"] },
  { id: "p-nearby", kind: "page", title: "Nearby", description: "The learner map and events near your city", href: "/nearby", icon: "map-pin", keywords: ["map", "learner map", "local", "city", "people near me"] },
  { id: "p-events", kind: "page", title: "Nearby events", description: "Meetups, workshops, and online events for your niches", href: "/nearby/events", icon: "calendar", keywords: ["events", "meetups", "workshops", "tickets"] },
  { id: "p-open-source", kind: "page", title: "Open Source", description: "Share and read learner contributions per niche", href: "/open-source", icon: "git-pull-request", keywords: ["community", "contribute", "posts", "share", "guides"] },
  { id: "p-my-contributions", kind: "page", title: "My contributions", description: "Your Open Source posts and their reviews", href: "/open-source/me", icon: "git-pull-request", keywords: ["my posts", "drafts", "withdraw"] },
  { id: "p-creator", kind: "page", title: "Creator studio", description: "Upload a video you made and send it for review", href: "/creator", icon: "video", keywords: ["upload video", "creator", "publish", "views"] },
  { id: "p-submit", kind: "page", title: "Submit a resource", description: "Suggest a video, doc, or course for a stage", href: "/submit", icon: "file-plus", keywords: ["suggest", "resource", "add link"] },
  { id: "p-byor", kind: "page", title: "Bring your own resource", description: "Get an explain-back prompt for your own resource", href: "/submit/byor", icon: "file-plus", keywords: ["byor", "own resource", "explain prompt"] },
  { id: "p-career", kind: "page", title: "Career-fit test", description: "Find the paths that fit your interests and traits", href: "/career-test", icon: "compass", keywords: ["career", "personality", "interests", "riasec", "big five", "which path", "test"] },
  { id: "p-career-report", kind: "page", title: "Career-fit report", description: "Your interest code, traits, and best-fit paths", href: "/career-test/report", icon: "compass", keywords: ["report", "results", "download"] },
  { id: "p-upgrade", kind: "page", title: "Premium", description: "What Premium adds, and how to upgrade", href: "/upgrade", icon: "sparkles", keywords: ["upgrade", "pricing", "subscription", "pay", "plan", "stripe", "billing"] },
  { id: "p-settings", kind: "page", title: "Settings", description: "Profile, appearance, notifications, and your account", href: "/settings", icon: "settings", keywords: ["preferences", "account", "options"] },
  { id: "p-onboarding", kind: "page", title: "Edit profile answers", description: "Your age range, goals, pace, and chosen paths", href: "/onboarding?edit=1", icon: "user-pen", keywords: ["onboarding", "goals", "pace", "about me"] },
  { id: "p-privacy", kind: "page", title: "Privacy Policy", description: "What SkillFlow collects and why", href: "/privacy", icon: "shield", keywords: ["privacy", "data", "gdpr", "dpdp"] },
  { id: "p-terms", kind: "page", title: "Terms of Service", description: "The rules for using SkillFlow", href: "/terms", icon: "file-text", keywords: ["terms", "conditions", "legal"] },

  // Features (what something is, and where to find it)
  { id: "f-explain", kind: "feature", title: "Explain-back", description: "Explain each idea in your own words to open the next stage", href: "/roadmap", icon: "message-square-quote", keywords: ["explain", "mastery check", "gate", "review", "ai review", "test my understanding"] },
  { id: "f-recall", kind: "feature", title: "Recall", description: "Passed ideas come back twice, 18 hours apart", href: "/notes", icon: "brain", keywords: ["spaced repetition", "memory", "remember", "retention"] },
  { id: "f-plan", kind: "feature", title: "Personal learning plan", description: "A weekly schedule from your pace and goals, on any path", href: "/roadmap", icon: "calendar-days", keywords: ["plan", "schedule", "pace", "deadline", "weekly"] },
  { id: "f-weak", kind: "feature", title: "Topics to strengthen", description: "Ideas that need another look, on Home", href: "/dashboard#home-weak", icon: "target", keywords: ["weak topics", "mistakes", "retry", "struggling"] },
  { id: "f-heatmap", kind: "feature", title: "Activity heatmap", description: "Every contribution, day by day, for a year", href: "/dashboard", icon: "calendar-check", keywords: ["heatmap", "activity", "contributions", "graph"] },
  { id: "f-transcript", kind: "feature", title: "Transcripts", description: "Every stage you passed, with its date", href: "/progress", icon: "scroll-text", keywords: ["transcript", "record", "pdf"] },
  { id: "f-certificate", kind: "feature", title: "Certificates", description: "Earned when every stage on a path is passed", href: "/progress", icon: "award", keywords: ["certificate", "completion", "badge"] },
  { id: "f-focus", kind: "feature", title: "Focus session", description: "A 25 or 50 minute timer that counts real learning", href: "/detox#focus", icon: "timer", keywords: ["pomodoro", "timer", "focus", "deep work", "study timer"] },
  { id: "f-swap", kind: "feature", title: "Swap a scroll", description: "Three minutes on one recall or one idea instead of a reel", href: "/detox?swap=1", icon: "repeat-2", keywords: ["swap", "instead of scrolling", "quick session"] },
  { id: "f-checkin", kind: "feature", title: "Weekly Detox check-in", description: "Screen time and focus, once a week", href: "/detox#checkin", icon: "calendar-check", keywords: ["check in", "screen time", "weekly"] },
  { id: "f-map", kind: "feature", title: "Learner map", description: "How many learners study near each city", href: "/nearby", icon: "map", keywords: ["map", "city", "people"] },
  { id: "f-profile", kind: "feature", title: "Public profile", description: "What other learners see about you", href: "/settings", icon: "user", keywords: ["profile", "public", "avatar", "headline"] },
  { id: "f-tour", kind: "feature", title: "Guided tour", description: "Every feature, hands-on, from Home", href: "/dashboard?tour=1", icon: "compass", keywords: ["tour", "tutorial", "help", "how to", "getting started", "walkthrough", "onboarding"] },

  // Settings
  { id: "s-profile", kind: "setting", title: "Display name and photo", description: "Settings · Profile", href: "/settings", icon: "user-pen", keywords: ["name", "avatar", "picture", "photo", "rename"] },
  { id: "s-appearance", kind: "setting", title: "Theme and accent colour", description: "Settings · Appearance: light, dark, presets, Spectrum, custom", href: "/settings", icon: "palette", keywords: ["theme", "dark mode", "light mode", "accent", "color", "colour", "spectrum", "gradient", "appearance"] },
  { id: "s-notifications", kind: "setting", title: "Notification switches", description: "Settings · Notifications", href: "/settings#notifications", icon: "bell", keywords: ["notifications", "reminders", "streak reminder", "mute", "alerts"] },
  { id: "s-visibility", kind: "setting", title: "Profile visibility", description: "Settings · Show activity or your Detox Score", href: "/settings", icon: "eye", keywords: ["privacy", "hide activity", "public", "detox score"] },
  { id: "s-city", kind: "setting", title: "Your city", description: "Settings · Location, for Nearby and the map", href: "/settings", icon: "map-pin", keywords: ["location", "city", "country"] },
  { id: "s-google", kind: "setting", title: "Google sign-in", description: "Settings · Sign-in: connect or disconnect Google", href: "/settings", icon: "key-round", keywords: ["google", "login", "password", "sign in"] },
  { id: "s-delete", kind: "setting", title: "Delete my account", description: "Settings · Danger zone", href: "/settings", icon: "trash-2", keywords: ["delete account", "remove data", "close account"] },
  { id: "s-billing", kind: "setting", title: "Manage subscription", description: "Premium plan and billing", href: "/upgrade", icon: "credit-card", keywords: ["cancel", "billing", "invoice", "subscription"] },

  // Quick actions
  { id: "a-theme", kind: "action", title: "Switch light or dark theme", description: "Changes the theme right away", action: "theme", icon: "sun-moon", keywords: ["dark mode", "light mode", "theme", "toggle"] },
  { id: "a-tour", kind: "action", title: "Replay the guided tour", description: "Opens the tour on Home", action: "tour", icon: "compass", keywords: ["tour", "tutorial", "help", "walkthrough"] },
  { id: "a-focus", kind: "action", title: "Start a focus session", description: "Opens Detox · Focus session", href: "/detox#focus", icon: "timer", keywords: ["focus", "timer", "pomodoro"] },
  { id: "a-swap", kind: "action", title: "Swap a scroll now", description: "One recall or one idea in three minutes", href: "/detox?swap=1", icon: "repeat-2", keywords: ["swap", "quick"] },
  { id: "a-contribute", kind: "action", title: "Write an Open Source contribution", description: "Pick a niche, then contribute", href: "/open-source", icon: "pencil", keywords: ["contribute", "write", "post", "share"] },

  // Help
  { id: "h-free", kind: "help", title: "What is free, and what is Premium?", description: "Thirty paths, every stage, explain-back, and certificates are free", href: "/upgrade", icon: "circle-help", keywords: ["free", "cost", "price", "premium", "paid"] },
  { id: "h-locked", kind: "help", title: "Why is a stage locked?", description: "The next stage opens after the explain-back on the one before it", href: "/roadmap", icon: "lock", keywords: ["locked", "cannot open", "next stage"] },
  { id: "h-score", kind: "help", title: "How is the Detox Score worked out?", description: "Your self-check, then only verified learning, with a daily limit", href: "/detox", icon: "circle-help", keywords: ["detox score", "how", "calculated", "points"] },
  { id: "h-mastery", kind: "help", title: "How is mastery measured?", description: "The share of a path's stages with a passed explain-back", href: "/progress", icon: "circle-help", keywords: ["mastery", "percent", "progress"] },
];

/** Shown before anything is typed. */
export const SEARCH_SUGGESTIONS = ["p-niches", "f-explain", "p-detox", "a-theme", "f-tour", "p-notes"];
