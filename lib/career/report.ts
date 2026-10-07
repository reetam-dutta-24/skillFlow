import "server-only";
import { askModelJson } from "@/lib/explain/judge";
import type { Area, Domain } from "./items";
import { AREAS, DOMAINS, FACETS } from "./meta";
import type { CareerScores } from "./score";
import { reportSchema, type ReportBody } from "./report-schema";

/** `stages` are the path's real first stage titles, in order, so the writing never names a stage that does not exist. */
export type ReportPath = { slug: string; name: string; stages: string[] };
export type ReportContext = { stage?: string | null; goals?: string[]; experience?: string | null; weeklyHours?: number | null };

export type CareerReport = ReportBody & { source: "model" | "rules" };

const SYSTEM = [
  "You write the narrative part of a career-fit report for a learner on SkillFlow, a learning app.",
  "You receive scores only: Big Five domain and facet scores from the IPIP-NEO-120 (as the percent of each scale's range and a band), Holland RIASEC interest scores from the O*NET Interest Profiler Short Form (0-40), the learner's three-letter interest code, and the paths SkillFlow ranked highest with their fit.",
  "Write in plain, warm, direct second person. Ground every claim in the scores given; never invent facts about the person.",
  "This is self-discovery, not a clinical or psychological assessment and not career counselling. Never diagnose, never mention disorders or mental illness, and never present a trait as good or bad. Describe high Neuroticism as feeling stress strongly, with practical ways to work with it.",
  "Scores are where the learner's own answers fall on each scale, not comparisons with other people. Do not say 'percentile' or 'than most people'.",
  "Only recommend the paths you are given, using their exact slugs. For each, explain why it fits these interests and traits, give 4 to 6 concrete steps for approaching it on SkillFlow (stages, resources, the explain-back after each stage, a personal plan with a deadline, Open Source, nearby events), and one sentence for the first week.",
  "When you name a stage, use only the stage titles listed for that path, exactly as written, with their stage number. Never invent a stage title, a module, a course, or a resource name.",
  "Return one JSON object with keys: summary (3-4 sentences), workStyle (2-3 sentences on the settings they likely thrive in), strengths (4-6 items of {title, detail}), watchOuts (3-4 items of {title, detail}, framed constructively), paths (one per given path: {slug, why, approach: string[], firstWeek}), growth (3 short suggestions).",
].join("\n");

function describeScores(scores: CareerScores, paths: ReportPath[], context: ReportContext) {
  const domainLines = (Object.keys(DOMAINS) as Domain[]).map(
    (domain) => `${DOMAINS[domain].name}: ${scores.domains[domain].pct}% (${scores.domains[domain].band})`,
  );
  const facetLines = Object.entries(scores.facets).map(([facet, value]) => `${FACETS[facet].name} (${facet}): ${value.pct}% (${value.band})`);
  const areaLines = (Object.keys(AREAS) as Area[]).map((area) => `${AREAS[area].name}: ${scores.areas[area].raw}/40`);
  const fit = new Map(scores.matches.map((match) => [match.slug, match]));
  const pathLines = paths.map((path) => {
    const match = fit.get(path.slug);
    const stages = path.stages.map((title, index) => `Stage ${index + 1}: ${title}`).join("; ");
    return `${path.slug} (${path.name}): fit ${match?.fit ?? 0}%, interest areas ${match?.areas.join("") ?? ""}, helpful traits ${match?.traits.join("") ?? ""}. First stages: ${stages || "not listed"}`;
  });
  return [
    "Big Five domains:",
    ...domainLines,
    "",
    "Facets:",
    ...facetLines,
    "",
    "Interests (O*NET Interest Profiler):",
    ...areaLines,
    `Interest code: ${scores.code.join("")}`,
    "",
    "Paths to recommend, best first:",
    ...pathLines,
    "",
    `Learner context: stage ${context.stage ?? "unknown"}; goals ${(context.goals ?? []).join(", ") || "unknown"}; experience ${context.experience ?? "unknown"}; about ${context.weeklyHours ?? "unknown"} hours a week.`,
    `Study advice already given (stay consistent with it): ${scores.studyStyle.join(" ")}`,
  ].join("\n");
}

const DOMAIN_STRENGTH: Record<Domain, { high: [string, string]; low: [string, string] }> = {
  O: {
    high: ["Curiosity", "You enjoy new ideas and variety, which makes unfamiliar paths feel exciting rather than daunting."],
    low: ["Practical focus", "You prefer what works in practice, so you get to useful results without getting lost in theory."],
  },
  C: {
    high: ["Follow-through", "You plan, keep at it, and finish, which is exactly what a path of eight or more stages needs."],
    low: ["Flexibility", "You adapt quickly and can switch approach when something is not working."],
  },
  E: {
    high: ["Energy with people", "You gain energy from others, so communities, events, and sharing your work keep you going."],
    low: ["Deep focus", "You are comfortable working alone for long stretches, which suits careful, detailed learning."],
  },
  A: {
    high: ["Cooperation", "You work well with others and enjoy helping them, which makes you a natural collaborator and teacher."],
    low: ["Independent judgement", "You are willing to disagree and hold your own standard, which keeps your work honest."],
  },
  N: {
    high: ["Sensitivity", "You notice when things are off, which can make you careful and thorough."],
    low: ["Composure", "You stay steady under pressure and bounce back quickly from setbacks."],
  },
};

const DOMAIN_WATCH: Partial<Record<Domain, { high?: [string, string]; low?: [string, string] }>> = {
  C: { low: ["Keeping momentum", "Long paths can stall. Small, fixed targets and a deadline on a personal plan help you keep moving."] },
  N: { high: ["Handling setbacks", "A thin answer can feel like a verdict. Treat each review as feedback on one idea and take the next step."] },
  O: { high: ["Spreading too thin", "New ideas pull at you. Finish one path's next stage before starting another."] },
  E: {
    high: ["Quiet practice", "Progress also needs solitary repetition. Book short solo sessions between the social parts."],
    low: ["Being seen", "Sharing work can feel uncomfortable, but one Open Source contribution makes your progress visible."],
  },
  A: { high: ["Saying no", "Helping others can crowd out your own learning. Keep your study time protected."] },
};

/** A complete report in plain code, used when there is no model key or the model's reply is unusable. */
export function rulesReport(scores: CareerScores, paths: ReportPath[]): CareerReport {
  const top = scores.code.map((area) => AREAS[area].name);
  const domains = Object.keys(DOMAINS) as Domain[];
  const strengths = domains
    .filter((domain) => scores.domains[domain].band !== "average")
    .map((domain) => {
      const [title, detail] = DOMAIN_STRENGTH[domain][scores.domains[domain].band === "high" ? "high" : "low"];
      return { title, detail };
    });
  for (const area of scores.code) {
    if (strengths.length >= 6) break;
    strengths.push({ title: `${AREAS[area].name} interests`, detail: `You are drawn to ${AREAS[area].about.charAt(0).toLowerCase()}${AREAS[area].about.slice(1)}` });
  }
  const watchOuts = domains
    .map((domain) => {
      const band = scores.domains[domain].band;
      const entry = band === "average" ? undefined : DOMAIN_WATCH[domain]?.[band];
      return entry ? { title: entry[0], detail: entry[1] } : null;
    })
    .filter((entry): entry is { title: string; detail: string } => Boolean(entry));
  if (watchOuts.length < 2) {
    watchOuts.push({ title: "Choosing one path", detail: "Several paths may appeal. Start with your top match and give it four stages before judging it." });
    watchOuts.push({ title: "Measuring progress", detail: "Count passed explain-backs, not hours watched; a passed stage is real progress." });
  }
  return {
    source: "rules",
    summary: `Your strongest interests are ${top.join(", ")}. Your answers point to someone who ${domains
      .filter((domain) => scores.domains[domain].band === "high")
      .map((domain) => DOMAINS[domain].high.toLowerCase().replace(/\.$/, ""))
      .slice(0, 2)
      .join(", and ") || "sits in the middle on most traits, which gives you room to adapt"}. The paths below are ranked by how well they match those interests and traits.`,
    workStyle: `You are likely to do your best work in settings that let you use ${top[0].toLowerCase()} and ${top[1].toLowerCase()} interests. ${scores.studyStyle[0] ?? ""}`,
    strengths: strengths.slice(0, 6).length >= 3 ? strengths.slice(0, 6) : [...strengths, ...DEFAULT_STRENGTHS].slice(0, 3),
    watchOuts: watchOuts.slice(0, 4),
    paths: paths.map((path) => {
      const match = scores.matches.find((entry) => entry.slug === path.slug);
      const areas = (match?.areas ?? []).slice(0, 2).map((area) => AREAS[area].name).join(" and ");
      return {
        slug: path.slug,
        why: `${path.name} leans on ${areas} interests, which line up with your strongest areas.`,
        approach: [
          path.stages[0] ? `Follow the path and open Stage 1, ${path.stages[0]}, from its roadmap.` : "Follow the path and open stage 1 from its roadmap.",
          "Watch the first clip, then work through the resources in order.",
          "Pass the explain-back for each stage before moving on; the review shows what to revisit.",
          "Set up a personal plan with a deadline that matches your weekly time.",
          ...scores.studyStyle.slice(0, 2),
        ].slice(0, 6),
        firstWeek: path.stages[0] ? `Finish Stage 1, ${path.stages[0]}, and pass its explain-back.` : "Finish stage 1 and pass its explain-back.",
      };
    }),
    growth: [
      "Retake the test in six months; interests shift as you try things.",
      "Pass two stages on your top match before adding a second path.",
      "Share one thing you learned on Open Source to make your progress visible.",
    ],
  };
}

const DEFAULT_STRENGTHS = [
  { title: "Balance", detail: "Your traits sit near the middle, so you can adapt your approach to the path rather than the other way round." },
  { title: "Range", detail: "You can work alone or with others, which keeps many paths open to you." },
  { title: "Steadiness", detail: "No single trait pulls hard in one direction, which makes your learning habits easier to shape." },
];

/** The written report. The model only shapes words around the scores; any failure falls back to the rules report. */
export async function writeReport(scores: CareerScores, paths: ReportPath[], context: ReportContext): Promise<CareerReport> {
  const raw = await askModelJson(SYSTEM, describeScores(scores, paths, context));
  const parsed = raw ? reportSchema.safeParse(raw) : null;
  if (!parsed?.success) return rulesReport(scores, paths);
  const allowed = new Set(paths.map((path) => path.slug));
  const modelPaths = parsed.data.paths.filter((path) => allowed.has(path.slug));
  // Keep the ranking from the scores, and fill any path the model skipped from the rules report.
  const fallback = rulesReport(scores, paths);
  const ordered = paths.map((path) => modelPaths.find((entry) => entry.slug === path.slug) ?? fallback.paths.find((entry) => entry.slug === path.slug)!);
  return { ...parsed.data, paths: ordered, source: "model" };
}
