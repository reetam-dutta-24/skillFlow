import "dotenv/config";
import { Prisma, type ContributionType, type Disclosure } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MARK = "skillflow-demo=";
const ADMIN_EMAIL = "admin1.skillflow@gmail.com";

type Draft = {
  type: ContributionType;
  title: string;
  summary: string;
  source: string;
  tags: string[];
  disclosure?: Disclosure;
  steps?: { title: string; url?: string; note?: string }[];
  stage?: boolean;
};

const DRAFTS: Record<string, Draft[]> = {
  "full-stack-web-dev": [
    { type: "RESOURCE", title: "MDN’s first website walkthrough", summary: "A short path for someone who has not written HTML yet. It stays on one page until the basics hold.", source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Your_first_website", tags: ["html", "beginner"] },
    { type: "CONCEPT_NOTE", title: "What a request actually carries", summary: "Method, path, headers, and body are the whole conversation. Naming them makes later debugging less mysterious.", source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages", tags: ["http"] },
    { type: "LEARNING_PATH", title: "A weekend HTML and CSS loop", summary: "Two pages, one stylesheet, and a pass where you explain each rule out loud.", source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content", tags: ["html", "css"], stage: true, steps: [
      { title: "Mark up a profile page", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content", note: "Use headings, a list, and one image." },
      { title: "Style it with a single file", note: "Change type, spacing, and one color. Stop there." },
    ] },
    { type: "FOLLOW", title: "web.dev’s Learn section", summary: "Short articles that stay close to what browsers ship. Useful when a tutorial is a year out of date.", source: "https://web.dev/learn", tags: ["browser"] },
    { type: "RESOURCE", title: "CSS layout: flex and grid side by side", summary: "The page that finally made the two layout models feel like tools instead of trivia.", source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout", tags: ["css", "layout"], stage: true },
    { type: "CONCEPT_NOTE", title: "The box model in one sitting", summary: "Content, padding, border, and margin. Draw it once. Most “why is this wider” bugs live here.", source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model", tags: ["css"] },
    { type: "RESOURCE", title: "JavaScript first steps on MDN", summary: "Variables, functions, and a little DOM. Skip the framework until this page feels easy.", source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting", tags: ["javascript"], stage: true },
    { type: "LEARNING_PATH", title: "From a static page to a tiny API", summary: "One form, one route, one saved note. The point is the round trip, not the stack.", source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side", tags: ["api"], steps: [
      { title: "Read what a server route is", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps", note: "Stay with the overview." },
      { title: "Return JSON for one resource", note: "A list of three notes is enough." },
    ] },
    { type: "FOLLOW", title: "HTTP Archive’s annual almanac", summary: "A yearly look at what the web actually serves. Good for killing cargo-cult advice.", source: "https://almanac.httparchive.org/", tags: ["web"] },
    { type: "CONCEPT_NOTE", title: "Accessibility is part of the layout", summary: "Labels, focus, and contrast are not a later pass. They change the markup you write today.", source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility", tags: ["a11y"], stage: true },
    { type: "RESOURCE", title: "Forms that don’t fight the user", summary: "Native validation, clear errors, and a submit that says what happened.", source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms", tags: ["forms"] },
    { type: "RESOURCE", title: "Git handbook, the short version", summary: "Commit, branch, and a pull request. Enough to work with someone else without a course.", source: "https://docs.github.com/en/get-started/using-git/about-git", tags: ["git"], disclosure: "NONE" },
    { type: "CONCEPT_NOTE", title: "Why we don’t put secrets in the client", summary: "Anything in the browser can be read. Tokens, keys, and admin checks belong on the server.", source: "https://developer.mozilla.org/en-US/docs/Web/Security", tags: ["security"] },
    { type: "LEARNING_PATH", title: "Ship a read-only list", summary: "Fetch data, render it, and handle the empty and error states before adding a create button.", source: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API", tags: ["javascript"], stage: true, steps: [
      { title: "Call one public JSON endpoint", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch", note: "Log the shape before you render." },
      { title: "Show loading, empty, and failure", note: "Three states, one list." },
    ] },
    { type: "FOLLOW", title: "The HTML living standard", summary: "Dense, but it is the source when a blog and the browser disagree.", source: "https://html.spec.whatwg.org/", tags: ["html"] },
    { type: "RESOURCE", title: "Testing a component by what the user sees", summary: "Queries that match labels and text catch the bugs a snapshot misses.", source: "https://testing-library.com/docs/queries/about/", tags: ["testing"] },
    { type: "CONCEPT_NOTE", title: "Caching is a product decision", summary: "Shared pages can be cached. A learner’s progress cannot. Mixing them makes the wrong screen stick.", source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching", tags: ["http"] },
  ],
  "travel-vlogging": [
    { type: "RESOURCE", title: "A shot list before you leave the room", summary: "Wide, detail, and a face. Three shots cover most travel scenes if you actually take them.", source: "https://en.wikipedia.org/wiki/Shot_(filmmaking)", tags: ["shots"], stage: true },
    { type: "CONCEPT_NOTE", title: "Story before scenery", summary: "A place is not a plot. One change — arrival, a meal, a missed train — gives the footage a spine.", source: "https://en.wikipedia.org/wiki/Narrative", tags: ["story"] },
    { type: "LEARNING_PATH", title: "Film one afternoon, edit that night", summary: "A single location so the cut is about sequence, not about collecting countries.", source: "https://en.wikipedia.org/wiki/Video_editing", tags: ["editing"], stage: true, steps: [
      { title: "Record a walk in", note: "Hold the wide shot for longer than feels comfortable." },
      { title: "Cut to under two minutes", url: "https://en.wikipedia.org/wiki/Video_editing", note: "Drop any shot you cannot justify." },
    ] },
    { type: "FOLLOW", title: "National Geographic’s video desk", summary: "Watch how little they explain and how much the picture carries.", source: "https://www.nationalgeographic.com/video", tags: ["reference"] },
    { type: "RESOURCE", title: "Audio that doesn’t ruin the take", summary: "Wind and handling noise are the usual failures. A cheap lav and a quiet room beat a pretty camera.", source: "https://en.wikipedia.org/wiki/Lavalier_microphone", tags: ["audio"], stage: true },
    { type: "CONCEPT_NOTE", title: "Consent in a public place", summary: "A crowd is not a release form. Faces you feature, and anyone you interview, should know they are in the piece.", source: "https://en.wikipedia.org/wiki/Personality_rights", tags: ["ethics"] },
    { type: "RESOURCE", title: "Color that matches the day you shot", summary: "Match white balance across clips before you grade for mood. Order matters.", source: "https://en.wikipedia.org/wiki/Color_grading", tags: ["color"] },
    { type: "FOLLOW", title: "UNESCO’s travel resources", summary: "Context for a place that is older than the vlog. Use it to avoid inventing history.", source: "https://www.unesco.org/en", tags: ["research"] },
    { type: "LEARNING_PATH", title: "A three-beat travel short", summary: "Leave, arrive, and one specific moment. No montage of every meal.", source: "https://en.wikipedia.org/wiki/Three-act_structure", tags: ["story"], steps: [
      { title: "Write the three beats on paper", note: "One sentence each." },
      { title: "Shoot only what those sentences need", url: "https://en.wikipedia.org/wiki/Shot_(filmmaking)", note: "Extra B-roll is optional, not the point." },
    ] },
    { type: "CONCEPT_NOTE", title: "Thumbnails are a frame, not a poster", summary: "A readable face or a clear place, and a title that matches the video. Surprise titles train people to skip you.", source: "https://en.wikipedia.org/wiki/Thumbnail", tags: ["packaging"] },
    { type: "RESOURCE", title: "Maps you can actually follow", summary: "Show the route once. Repeating the same map between every clip makes the film feel like a slideshow.", source: "https://en.wikipedia.org/wiki/Cartography", tags: ["maps"], stage: true },
    { type: "RESOURCE", title: "Interviewing someone who is not a host", summary: "One question, then wait. The pause is usually the sentence you wanted.", source: "https://en.wikipedia.org/wiki/Interview", tags: ["interview"] },
    { type: "FOLLOW", title: "The Internet Archive’s travel films", summary: "Older footage is a reminder that the place existed before the channel.", source: "https://archive.org/details/movies", tags: ["reference"] },
    { type: "CONCEPT_NOTE", title: "Battery, cards, and a boring backup", summary: "The glamorous failure is a full card at the one moment that mattered. Copy footage before you sleep.", source: "https://en.wikipedia.org/wiki/Backup", tags: ["workflow"] },
    { type: "LEARNING_PATH", title: "Voiceover that doesn’t drone", summary: "Write it after the cut, then record in a quiet room. Picture first, words second.", source: "https://en.wikipedia.org/wiki/Voice-over", tags: ["audio"], stage: true, steps: [
      { title: "Lock a rough cut with no voice", note: "If it is confusing, the pictures are the problem." },
      { title: "Write only the lines the pictures cannot say", url: "https://en.wikipedia.org/wiki/Voice-over", note: "Read it aloud once before recording." },
    ] },
    { type: "RESOURCE", title: "Music you are allowed to use", summary: "A track you like is not a track you can publish. Start from a library that states the license.", source: "https://en.wikipedia.org/wiki/Royalty-free", tags: ["music"], disclosure: "NONE" },
    { type: "CONCEPT_NOTE", title: "Cut on action, not on boredom", summary: "Change the shot when something moves, not when you are tired of the frame.", source: "https://en.wikipedia.org/wiki/Cutting_on_action", tags: ["editing"] },
  ],
  "content-creation": [
    { type: "RESOURCE", title: "A brief before you open an editor", summary: "Who it is for, what they should do after, and the one idea. Three lines save a week of footage.", source: "https://en.wikipedia.org/wiki/Creative_brief", tags: ["planning"], stage: true },
    { type: "CONCEPT_NOTE", title: "One audience, one promise", summary: "A post that tries to serve everyone teaches no one. Name the person and the change.", source: "https://en.wikipedia.org/wiki/Target_audience", tags: ["audience"] },
    { type: "LEARNING_PATH", title: "Publish one useful thing a week", summary: "A repeatable shape: hook, demonstration, and a next step the viewer can do today.", source: "https://en.wikipedia.org/wiki/Content_creation", tags: ["habit"], steps: [
      { title: "Pick a task you can show in one minute", note: "If it needs a preface, it is too big." },
      { title: "End with the action", url: "https://en.wikipedia.org/wiki/Call_to_action_(marketing)", note: "One verb, not a menu." },
    ] },
    { type: "FOLLOW", title: "Nielsen Norman Group", summary: "Research on how people actually read and click. It punctures a lot of growth folklore.", source: "https://www.nngroup.com/articles/", tags: ["research"] },
    { type: "RESOURCE", title: "Titles that describe the piece", summary: "Say the outcome. Clever and empty titles get the click once.", source: "https://en.wikipedia.org/wiki/Headline", tags: ["titles"], stage: true },
    { type: "CONCEPT_NOTE", title: "Hooks are the first true sentence", summary: "Start with the problem or the result. A channel intro is not a hook.", source: "https://en.wikipedia.org/wiki/Lead_paragraph", tags: ["writing"] },
    { type: "RESOURCE", title: "Scripting for the ear", summary: "Short sentences. Read it out loud. If you stumble, the viewer will too.", source: "https://en.wikipedia.org/wiki/Script_(recorded_media)", tags: ["script"], stage: true },
    { type: "FOLLOW", title: "The Creative Commons search", summary: "A place to look before you grab a photo from a search result.", source: "https://search.creativecommons.org/", tags: ["licensing"] },
    { type: "LEARNING_PATH", title: "Repurpose one idea into three formats", summary: "A short video, a still with the same point, and a written version. Same idea, not three ideas.", source: "https://en.wikipedia.org/wiki/Content_format", tags: ["repurpose"], steps: [
      { title: "Write the point in one sentence", note: "If you need two, you have two pieces." },
      { title: "Make the video first", note: "The still and the post quote it. They do not add a new claim." },
    ] },
    { type: "CONCEPT_NOTE", title: "Sponsorship you can see", summary: "Say who paid, near the claim they paid for. A disclosure in the description is easy to miss.", source: "https://en.wikipedia.org/wiki/Native_advertising", tags: ["disclosure"], disclosure: "I_MADE_THIS" },
    { type: "RESOURCE", title: "Thumbnails and the first frame", summary: "The still and the opening second should agree. A mismatch feels like a trick.", source: "https://en.wikipedia.org/wiki/Thumbnail", tags: ["packaging"] },
    { type: "RESOURCE", title: "Captions are part of the edit", summary: "Many people watch without sound. If the caption is the only version of the joke, write it on purpose.", source: "https://en.wikipedia.org/wiki/Closed_captioning", tags: ["captions"], stage: true },
    { type: "CONCEPT_NOTE", title: "Metrics that match the goal", summary: "Saves and finishes tell you the piece was useful. A view only says it started.", source: "https://en.wikipedia.org/wiki/Web_analytics", tags: ["metrics"] },
    { type: "FOLLOW", title: "Wikimedia Commons", summary: "Photographs with a stated license. Check the page, not just the preview.", source: "https://commons.wikimedia.org/wiki/Main_Page", tags: ["licensing"] },
    { type: "LEARNING_PATH", title: "A critique pass with one other person", summary: "They watch once, then tell you where they got lost. You do not explain while they watch.", source: "https://en.wikipedia.org/wiki/Critique", tags: ["editing"], steps: [
      { title: "Watch in silence", note: "No pausing to defend a cut." },
      { title: "Change one confusion", note: "The note you heard twice is the edit." },
    ] },
    { type: "RESOURCE", title: "A posting calendar that survives a bad week", summary: "One slot you can hit when you are tired. A calendar you abandon teaches nothing.", source: "https://en.wikipedia.org/wiki/Editorial_calendar", tags: ["planning"] },
  ],
};

function withMark(url: string, code: string) {
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}${MARK}${code}`;
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL, role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) throw new Error("Admin account was not found.");

  const skills = await prisma.skill.findMany({
    where: { slug: { in: Object.keys(DRAFTS) } },
    select: {
      id: true,
      slug: true,
      image: true,
      stages: { orderBy: { order: "asc" }, take: 6, select: { id: true } },
    },
  });
  if (skills.length !== 3) throw new Error("Expected the three flagship niches.");

  const removed = await prisma.communityContribution.deleteMany({
    where: { normalizedUrl: { contains: MARK } },
  });

  const now = Date.now();
  const rows: Prisma.CommunityContributionCreateManyInput[] = [];
  let sequence = 0;
  for (const skill of skills) {
    const drafts = DRAFTS[skill.slug];
    drafts.forEach((draft, index) => {
      sequence += 1;
      const code = `${skill.slug}-${String(index + 1).padStart(2, "0")}`;
      const url = withMark(draft.source, code);
      const createdAt = new Date(now - (drafts.length * skills.length - sequence) * 36 * 60 * 60 * 1000);
      const stageId = draft.stage && skill.stages.length > 0 ? skill.stages[index % skill.stages.length].id : null;
      rows.push({
        skillId: skill.id,
        authorId: admin.id,
        type: draft.type,
        status: "MERGED",
        title: draft.title,
        summary: draft.summary,
        body: draft.summary,
        imageUrl: index % 2 === 0 ? skill.image : null,
        url,
        normalizedUrl: url,
        sources: [url],
        steps: draft.steps ? (draft.steps as Prisma.InputJsonValue) : Prisma.DbNull,
        tags: draft.tags,
        stageId,
        disclosure: draft.disclosure ?? "NONE",
        linkStatus: "NOT_CHECKED",
        usefulCount: (index * 3) % 11,
        mergedAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
        mergedById: admin.id,
        createdAt,
      });
    });
  }

  if (rows.length !== 50) throw new Error(`Expected 50 drafts, got ${rows.length}.`);
  await prisma.communityContribution.createMany({ data: rows });
  const counts = await prisma.communityContribution.groupBy({
    by: ["skillId"],
    where: { normalizedUrl: { contains: MARK }, status: "MERGED" },
    _count: { _all: true },
  });
  const bySlug = Object.fromEntries(skills.map((skill) => [skill.id, skill.slug]));
  console.log(`Removed ${removed.count} earlier demo rows.`);
  console.log(`Inserted ${rows.length} merged contributions.`);
  for (const count of counts) console.log(`${bySlug[count.skillId]}: ${count._count._all}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
