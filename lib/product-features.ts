/**
 * What a signed-in learner can use today, one entry per feature. The landing page counts this list,
 * so add a feature here when it ships and remove it when it is dropped.
 */
export const PRODUCT_FEATURES = [
  { id: "paths", name: "Paths of ordered stages", href: "/roadmap" },
  { id: "lessons", name: "Lessons with real resources and in-app video", href: "/roadmap" },
  { id: "explain-back", name: "Explain-back, one idea at a time", href: "/roadmap" },
  { id: "notes", name: "Notes with Word and PDF export", href: "/notes" },
  { id: "practice", name: "Practice notes from your own text", href: "/notes/practice" },
  { id: "recall", name: "Recall checks on passed ideas", href: "/notes" },
  { id: "plan", name: "A personal learning plan", href: "/roadmap" },
  { id: "career-test", name: "Career-fit test", href: "/career-test" },
  { id: "detox", name: "Dopamine Detox with a verified Detox Score", href: "/detox" },
  { id: "weak-topics", name: "Topics to strengthen", href: "/dashboard" },
  { id: "progress", name: "Progress and analytics", href: "/analytics" },
  { id: "activity", name: "Activity heatmap", href: "/dashboard" },
  { id: "transcript", name: "Transcripts", href: "/progress" },
  { id: "certificate", name: "Certificates", href: "/progress" },
  { id: "clips", name: "Clips feed", href: "/clips" },
  { id: "open-source", name: "Open Source community", href: "/open-source" },
  { id: "creator", name: "Creator studio", href: "/creator" },
  { id: "submit", name: "Suggest or bring your own resource", href: "/submit" },
  { id: "events", name: "Nearby events", href: "/nearby/events" },
  { id: "map", name: "Learner map", href: "/nearby" },
  { id: "profile", name: "Public profile", href: "/settings" },
  { id: "appearance", name: "Themes and accents", href: "/settings" },
  { id: "tour", name: "Interactive product tour", href: "/dashboard" },
] as const;
