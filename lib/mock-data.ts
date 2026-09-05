// Static mock/placeholder data for the UI-shell phase. No Prisma, no auth —
// every page in app/(routes) reads from this module. Shapes match the
// component props directly (see components/**/*.d.ts) rather than the
// Prisma schema, so pages don't need transform glue.

export type StageStatus = "done" | "active" | "todo" | "locked";

export interface MockQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MockExplainBack {
  concept: string;
  prompt: string;
  followUpQuestion: string;
  passFeedback: string;
  needsImprovementFeedback: string;
}

export interface MockResource {
  title: string;
  url: string;
  source: string;
  length?: string;
}

export interface MockStage {
  id: string;
  skillSlug: string;
  order: number;
  title: string;
  description: string;
  status: StageStatus;
  mastery?: number;
  meta: string;
  unlockHint?: string;
  lesson: { title: string; duration: string };
  resource: MockResource;
  quiz: MockQuizQuestion[];
  explainBack: MockExplainBack;
}

export interface MockSkill {
  slug: string;
  name: string;
  description: string;
  isFlagship: boolean;
  mastery: number;
  stages: MockStage[];
}

export interface WeakTopic {
  id: string;
  topic: string;
  skill: string;
  detail?: string;
  accuracy: number;
  severity: "high" | "medium";
  stageId: string;
}

function stage(skillSlug: string, partial: Omit<MockStage, "skillSlug">): MockStage {
  return { skillSlug, ...partial };
}

export const skills: MockSkill[] = [
  {
    slug: "full-stack-web-dev",
    name: "Full-Stack Web Development",
    description: "Ship real products end to end — from semantic HTML to a deployed full-stack app.",
    isFlagship: true,
    mastery: 42,
    stages: [
      stage("full-stack-web-dev", {
        id: "fswd-1",
        order: 1,
        title: "HTML & CSS Foundations",
        description: "Semantic markup, the box model, and layout with Flexbox and Grid.",
        status: "done",
        mastery: 100,
        meta: "3 lessons · 1 quiz · explain-back gate",
        lesson: { title: "Semantic HTML & the Box Model", duration: "11 min" },
        resource: {
          title: "MDN: Introduction to HTML",
          url: "https://developer.mozilla.org/en-US/docs/Learn/HTML",
          source: "MDN Web Docs",
          length: "25 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "Which element is the correct semantic choice for a page's primary navigation links?",
            options: ["<div class=\"nav\">", "<nav>", "<section>", "<header>"],
            correctIndex: 1,
            explanation: "<nav> tells assistive tech and search engines this block is navigation — a <div> carries no meaning.",
          },
          {
            id: "q2",
            prompt: "With the default box-sizing, does width include padding and border?",
            options: ["Yes, always", "No — width is content-box only", "Only if you add border-box", "Only for inline elements"],
            correctIndex: 1,
            explanation: "content-box (the default) means width sets the content area; padding and border are added on top.",
          },
          {
            id: "q3",
            prompt: "In Flexbox, which property controls alignment along the cross axis?",
            options: ["justify-content", "align-items", "flex-direction", "gap"],
            correctIndex: 1,
            explanation: "justify-content works on the main axis; align-items handles the cross axis.",
          },
        ],
        explainBack: {
          concept: "The CSS Box Model",
          prompt: "Explain how margin, border, padding, and content interact to determine an element's rendered size.",
          followUpQuestion: "If you set box-sizing: border-box on an element, what actually changes — and why might that be useful in a real layout?",
          passFeedback: "Solid — you correctly tied box-sizing to how width is calculated and gave a concrete layout reason to prefer border-box.",
          needsImprovementFeedback: "You named the four box-model layers, but the follow-up needed a clearer explanation of what border-box changes about the width calculation itself, not just that it exists.",
        },
      }),
      stage("full-stack-web-dev", {
        id: "fswd-2",
        order: 2,
        title: "JavaScript & the DOM",
        description: "Selecting, updating, and listening to the DOM with vanilla JavaScript.",
        status: "active",
        meta: "4 lessons · 1 quiz · explain-back gate",
        lesson: { title: "Event Handling & the DOM Tree", duration: "14 min" },
        resource: {
          title: "Introduction to browser events",
          url: "https://javascript.info/introduction-browser-events",
          source: "javascript.info",
          length: "18 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "What does event.target refer to inside a click handler?",
            options: ["The element the listener is attached to", "The element that was actually clicked", "The window object", "The event name"],
            correctIndex: 1,
            explanation: "target is the deepest element that triggered the event; currentTarget is the one the listener is on.",
          },
          {
            id: "q2",
            prompt: "Which technique lets one listener on a parent handle clicks on many dynamically-added children?",
            options: ["Event bubbling / delegation", "Event capturing only", "Polling with setInterval", "Cloning the node"],
            correctIndex: 0,
            explanation: "Because events bubble up, a single parent listener can inspect event.target to handle any child.",
          },
          {
            id: "q3",
            prompt: "What does document.querySelector('.card') return if no match exists?",
            options: ["undefined", "null", "an empty array", "throws an error"],
            correctIndex: 1,
            explanation: "querySelector returns null on no match — querySelectorAll returns an empty NodeList instead.",
          },
        ],
        explainBack: {
          concept: "Event Delegation",
          prompt: "Explain why attaching one listener to a parent container is often better than attaching a listener to every child element.",
          followUpQuestion: "You have a list where items can be added after page load. Walk through exactly what happens, step by step, when a newly-added item is clicked and delegation is used.",
          passFeedback: "Nice — you traced the bubble from the clicked child up to the parent listener and correctly used event.target to identify it, including the newly-added item.",
          needsImprovementFeedback: "The general idea of delegation was right, but the walkthrough didn't clearly explain how a listener attached before the new item existed still catches its click.",
        },
      }),
      stage("full-stack-web-dev", {
        id: "fswd-3",
        order: 3,
        title: "React Fundamentals",
        description: "Components, props, state, and the render cycle.",
        status: "locked",
        meta: "5 lessons · 1 quiz · explain-back gate",
        unlockHint: 'Complete the explain-back check on "JavaScript & the DOM" to unlock.',
        lesson: { title: "Components, Props & State", duration: "16 min" },
        resource: {
          title: "Describing the UI",
          url: "https://react.dev/learn/describing-the-ui",
          source: "react.dev",
          length: "22 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "What triggers a React component to re-render?",
            options: ["Any DOM mutation", "A change to its state or props", "A page reload", "Nothing — components render once"],
            correctIndex: 1,
            explanation: "React re-renders a component when its own state changes, or when the props passed to it change.",
          },
          {
            id: "q2",
            prompt: "Why does React ask for a stable key on list items?",
            options: ["It's required by JSX syntax", "To help React match items across re-renders efficiently", "To style the list", "To sort the array"],
            correctIndex: 1,
            explanation: "Keys let React tell which items changed, were added, or removed instead of re-rendering the whole list.",
          },
          {
            id: "q3",
            prompt: "Where should data that many sibling components need to share usually live?",
            options: ["In each sibling's own state", "Lifted up to their common parent", "In the DOM directly", "In a global variable"],
            correctIndex: 1,
            explanation: "Lifting state up to the nearest common ancestor keeps siblings in sync through shared props.",
          },
        ],
        explainBack: {
          concept: "Lifting State Up",
          prompt: "Explain, with an example, why shared data between sibling components should live in their common parent instead of in each sibling.",
          followUpQuestion: "Two sibling components need to stay in sync — a filter input and a results list. Describe exactly where the filter text should live and how each sibling gets it.",
          passFeedback: "Correct — the filter text belongs in the parent's state, passed down as props to both children, with a callback for the input to update it.",
          needsImprovementFeedback: "The concept of lifting state up was mentioned, but the example didn't say how the input actually updates the shared value the list reads from.",
        },
      }),
      stage("full-stack-web-dev", {
        id: "fswd-4",
        order: 4,
        title: "Full-Stack Deployment",
        description: "Connecting a database, an API layer, and shipping to production.",
        status: "locked",
        meta: "4 lessons · 1 quiz · explain-back gate",
        unlockHint: 'Complete the explain-back check on "React Fundamentals" to unlock.',
        lesson: { title: "From localhost to Production", duration: "13 min" },
        resource: {
          title: "Deploying a full-stack app",
          url: "https://nextjs.org/docs/app/building-your-application/deploying",
          source: "Next.js Docs",
          length: "15 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "Why should database credentials live in environment variables instead of source code?",
            options: ["They load faster that way", "So secrets aren't committed to version control", "It's required by all databases", "Environment variables are encrypted automatically"],
            correctIndex: 1,
            explanation: "Env vars keep secrets out of git history, so credentials aren't exposed if the repo is shared or leaked.",
          },
          {
            id: "q2",
            prompt: "What's the purpose of a database migration?",
            options: ["To back up data", "To version and apply schema changes in a repeatable way", "To speed up queries", "To rename a database"],
            correctIndex: 1,
            explanation: "Migrations record schema changes as ordered, repeatable steps so every environment ends up in the same state.",
          },
          {
            id: "q3",
            prompt: "In a typical production setup, what usually sits between the client and the database?",
            options: ["Nothing — the client queries the database directly", "An API/server layer that validates and authorizes requests", "Only a CDN", "The browser's local storage"],
            correctIndex: 1,
            explanation: "An API layer validates input and enforces access rules before anything reaches the database.",
          },
        ],
        explainBack: {
          concept: "Environment Configuration",
          prompt: "Explain why an app's database connection settings should differ between local development and production, and how that's typically managed.",
          followUpQuestion: "Your local .env has a database URL pointing at a Docker container. What has to change for the same code to run correctly once deployed?",
          passFeedback: "Correct — you identified that the DATABASE_URL itself needs to point at the production database, set via the hosting platform's environment variables rather than the committed .env file.",
          needsImprovementFeedback: "The distinction between local and production config was right in spirit, but the follow-up needed to name what specifically changes (the connection string) and where it's set in production.",
        },
      }),
    ],
  },
  {
    slug: "art-painting",
    name: "Art & Painting",
    description: "Build real drawing fundamentals, then move into color, composition, and digital painting.",
    isFlagship: true,
    mastery: 12,
    stages: [
      stage("art-painting", {
        id: "art-1",
        order: 1,
        title: "Drawing Fundamentals",
        description: "Line, proportion, and gesture — the groundwork everything else builds on.",
        status: "active",
        meta: "3 lessons · 1 quiz · explain-back gate",
        lesson: { title: "Gesture Drawing & Proportion", duration: "12 min" },
        resource: {
          title: "Loomis method: figure proportion basics",
          url: "https://www.proko.com/figure-drawing-fundamentals",
          source: "Proko",
          length: "20 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "What is the main goal of a 30-second gesture drawing?",
            options: ["Perfect anatomical detail", "Capturing the pose's energy and flow quickly", "Accurate shading", "Precise measurements"],
            correctIndex: 1,
            explanation: "Gesture drawing trades detail for speed — it's about capturing motion and weight, not precision.",
          },
          {
            id: "q2",
            prompt: "In classic figure proportion, roughly how many 'head lengths' tall is an average adult figure?",
            options: ["4", "6", "7.5", "10"],
            correctIndex: 2,
            explanation: "The common convention for an idealized adult figure is about 7.5 head-lengths tall.",
          },
          {
            id: "q3",
            prompt: "What does 'line of action' refer to in a gesture drawing?",
            options: ["The outline of the whole figure", "A single flowing line capturing the pose's main movement", "The horizon line", "A ruler-straight guideline"],
            correctIndex: 1,
            explanation: "The line of action is one sweeping stroke that establishes the pose's overall rhythm before any detail.",
          },
        ],
        explainBack: {
          concept: "Line of Action",
          prompt: "Explain what a line of action is and why artists draw it before anything else in a gesture study.",
          followUpQuestion: "You're given 30 seconds to draw a running figure. What's the very first mark you make, and why that one first?",
          passFeedback: "Good — you correctly identified the line of action as the first mark, and explained that it locks in the pose's energy before details can distract from it.",
          needsImprovementFeedback: "The definition of line of action was close, but the follow-up should explain why it comes before any other mark, not just that it's drawn first.",
        },
      }),
      stage("art-painting", {
        id: "art-2",
        order: 2,
        title: "Color Theory",
        description: "Hue, value, saturation, and how colors relate to each other on the wheel.",
        status: "locked",
        meta: "3 lessons · 1 quiz · explain-back gate",
        unlockHint: 'Complete the explain-back check on "Drawing Fundamentals" to unlock.',
        lesson: { title: "The Color Wheel & Value", duration: "10 min" },
        resource: {
          title: "Color theory for painters",
          url: "https://www.khanacademy.org/humanities/art-history-basics/beginners-guide-to-asian-art-culture/beginners-guide-to-asian-art-culture/",
          source: "Various open art references",
          length: "15 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "What does 'value' refer to in painting?",
            options: ["The monetary worth of a piece", "How light or dark a color is", "The saturation of a hue", "The brand of paint used"],
            correctIndex: 1,
            explanation: "Value is lightness/darkness independent of hue — it's usually the single most important factor for a painting reading correctly.",
          },
          {
            id: "q2",
            prompt: "Which pair of colors are complementary on a standard color wheel?",
            options: ["Red and green", "Red and orange", "Blue and purple", "Yellow and orange"],
            correctIndex: 0,
            explanation: "Complementary colors sit opposite each other on the wheel — red/green, blue/orange, and yellow/purple are the classic pairs.",
          },
          {
            id: "q3",
            prompt: "Mixing a color with its complement tends to do what?",
            options: ["Make it brighter", "Neutralize/dull it toward gray", "Make it more saturated", "Have no visible effect"],
            correctIndex: 1,
            explanation: "Complements cancel each other's hue, pulling the mix toward a neutral gray-brown.",
          },
        ],
        explainBack: {
          concept: "Value vs. Hue",
          prompt: "Explain the difference between a color's value and its hue, and why value usually matters more for a painting to 'read' correctly.",
          followUpQuestion: "Two paintings use completely different color palettes but look equally convincing. What's the most likely shared reason, in terms of value?",
          passFeedback: "Exactly right — as long as the value relationships (the lights and darks) are correct, the hue choices can vary widely and the painting still reads.",
          needsImprovementFeedback: "The value/hue distinction was there, but the follow-up needed to connect that directly to why the value structure — not the specific colors — is what makes a painting convincing.",
        },
      }),
      stage("art-painting", {
        id: "art-3",
        order: 3,
        title: "Composition & Focal Point",
        description: "Guiding the viewer's eye with framing, contrast, and the rule of thirds.",
        status: "locked",
        meta: "3 lessons · 1 quiz · explain-back gate",
        unlockHint: 'Complete the explain-back check on "Color Theory" to unlock.',
        lesson: { title: "Framing & the Rule of Thirds", duration: "9 min" },
        resource: {
          title: "Composition basics for illustrators",
          url: "https://conceptartempire.com/composition-in-art/",
          source: "Concept Art Empire",
          length: "17 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "What is a 'focal point' in a composition?",
            options: ["The exact center of the canvas", "The area the viewer's eye is drawn to first", "The darkest color used", "The largest shape"],
            correctIndex: 1,
            explanation: "The focal point is wherever contrast, detail, or placement pulls the eye first — it doesn't have to be centered.",
          },
          {
            id: "q2",
            prompt: "The rule of thirds suggests placing key elements where?",
            options: ["Dead center", "Along lines dividing the canvas into thirds", "In a corner only", "Randomly"],
            correctIndex: 1,
            explanation: "Placing points of interest near the third-lines or their intersections tends to feel more balanced than dead center.",
          },
          {
            id: "q3",
            prompt: "Which is the most reliable way to create a strong focal point?",
            options: ["Using the brightest color everywhere", "Maximum contrast right at that spot, minimal elsewhere", "Filling the whole canvas with detail", "Symmetry"],
            correctIndex: 1,
            explanation: "The eye goes to the area of highest contrast — keeping the rest of the piece quieter makes that spot stand out.",
          },
        ],
        explainBack: {
          concept: "Contrast as a Focal-Point Tool",
          prompt: "Explain how an artist can direct a viewer's eye to a specific spot using contrast, without relying only on placement.",
          followUpQuestion: "A painting feels flat — no clear focal point — even though the subject is placed on a rule-of-thirds line. What's the most likely fix?",
          passFeedback: "Right — placement alone isn't enough; increasing value or edge contrast right at the subject (and quieting it elsewhere) is what actually creates a focal pull.",
          needsImprovementFeedback: "You named contrast as a factor, but the follow-up needed a concrete diagnosis — that quiet, even contrast everywhere else is what's likely flattening the focal point.",
        },
      }),
      stage("art-painting", {
        id: "art-4",
        order: 4,
        title: "Digital Painting Basics",
        description: "Brushes, layers, and blending modes in a digital painting workflow.",
        status: "locked",
        meta: "4 lessons · 1 quiz · explain-back gate",
        unlockHint: 'Complete the explain-back check on "Composition & Focal Point" to unlock.',
        lesson: { title: "Layers, Blending & Brush Basics", duration: "14 min" },
        resource: {
          title: "Digital painting for beginners",
          url: "https://www.adobe.com/creativecloud/illustration/discover/digital-painting.html",
          source: "Adobe",
          length: "12 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "What's the main benefit of painting on separate layers?",
            options: ["It reduces file size", "Elements can be edited independently without affecting the rest", "It's required by all software", "It automatically improves color"],
            correctIndex: 1,
            explanation: "Layers let you isolate elements (sketch, base color, shading) so you can adjust one without redoing the others.",
          },
          {
            id: "q2",
            prompt: "A 'clipping mask' layer is most useful for what?",
            options: ["Deleting a layer", "Constraining paint strokes to the shape of the layer below", "Merging all layers", "Changing canvas size"],
            correctIndex: 1,
            explanation: "Clipping a layer to the one below means anything painted only shows up within that shape — great for shading within a flat color.",
          },
          {
            id: "q3",
            prompt: "Which blending mode is commonly used to add glowing light effects?",
            options: ["Normal", "Multiply", "Add / Screen", "Dissolve"],
            correctIndex: 2,
            explanation: "Add/Screen modes brighten by combining light values, which is why they're the go-to for glows and highlights.",
          },
        ],
        explainBack: {
          concept: "Non-Destructive Layer Workflow",
          prompt: "Explain why separating a digital painting into sketch, base color, and shading layers is considered 'non-destructive,' and what that protects you from.",
          followUpQuestion: "Halfway through shading, you realize the base color needs to change. Walk through what happens with a layered workflow versus painting everything on one flat layer.",
          passFeedback: "Exactly — with layers you can fix the base color layer alone and the clipped shading updates with it, versus repainting everything from scratch on a flat layer.",
          needsImprovementFeedback: "The layer concept was right, but the walkthrough didn't clearly contrast what recovery looks like with layers versus the extra rework a flat layer would require.",
        },
      }),
    ],
  },
  {
    slug: "content-creation",
    name: "Content Creation",
    description: "Find your niche, write hooks that hold attention, and build a short-form video pipeline.",
    isFlagship: true,
    mastery: 68,
    stages: [
      stage("content-creation", {
        id: "cc-1",
        order: 1,
        title: "Finding Your Niche & Voice",
        description: "Picking a lane, defining your audience, and developing a consistent voice.",
        status: "done",
        mastery: 96,
        meta: "3 lessons · 1 quiz · explain-back gate",
        lesson: { title: "Niche Selection & Audience Fit", duration: "10 min" },
        resource: {
          title: "How to find your content niche",
          url: "https://blog.hubspot.com/marketing/content-niche",
          source: "HubSpot",
          length: "14 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "Why does picking a specific niche usually beat 'making content about everything'?",
            options: ["It's easier to film", "It builds a recognizable, targeted audience faster", "Algorithms require it", "It needs less editing"],
            correctIndex: 1,
            explanation: "A specific niche gives viewers a clear reason to follow and lets the algorithm match you to the right audience.",
          },
          {
            id: "q2",
            prompt: "What's a practical way to validate a niche idea before committing?",
            options: ["Guessing", "Checking if there's an existing, engaged audience searching for it", "Picking the most popular topic overall", "Avoiding competitors entirely"],
            correctIndex: 1,
            explanation: "Evidence of existing demand (search volume, active communities) is a much stronger signal than intuition alone.",
          },
          {
            id: "q3",
            prompt: "'Voice' in content creation mainly refers to what?",
            options: ["Literal audio quality", "The consistent tone/personality across your content", "Video resolution", "Posting frequency"],
            correctIndex: 1,
            explanation: "Voice is the recognizable personality and tone that stays consistent across pieces, regardless of topic.",
          },
        ],
        explainBack: {
          concept: "Niche vs. Audience",
          prompt: "Explain the difference between choosing a niche and defining an audience, and why both matter.",
          followUpQuestion: "Two creators both post about 'productivity.' One grows quickly, one doesn't. What's a likely difference in how they defined their audience?",
          passFeedback: "Good — you connected faster growth to a more specifically defined audience (not just a topic), which sharpens every content decision downstream.",
          needsImprovementFeedback: "The niche/audience distinction was there, but the answer needed to tie audience specificity directly to why one creator would outgrow the other.",
        },
      }),
      stage("content-creation", {
        id: "cc-2",
        order: 2,
        title: "Scripting & Hook Writing",
        description: "Writing openings that stop the scroll, and structuring a script that holds attention.",
        status: "done",
        mastery: 88,
        meta: "3 lessons · 1 quiz · explain-back gate",
        lesson: { title: "Writing a 3-Second Hook", duration: "9 min" },
        resource: {
          title: "The anatomy of a scroll-stopping hook",
          url: "https://later.com/blog/video-hooks/",
          source: "Later",
          length: "11 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "What's the main job of a video's first 3 seconds?",
            options: ["Introduce yourself formally", "Earn the next 3 seconds of attention", "Show the logo", "Explain the full topic"],
            correctIndex: 1,
            explanation: "The hook's only job is to stop the scroll — it earns permission for the rest of the video to be watched.",
          },
          {
            id: "q2",
            prompt: "Which of these is the strongest hook structure?",
            options: ["\"Hi guys, welcome back to my channel\"", "A specific, curiosity-driving claim or question tied to the topic", "A long disclaimer", "Background music with no words"],
            correctIndex: 1,
            explanation: "Specific, curiosity-driving openers outperform generic greetings, which waste the highest-attention seconds you get.",
          },
          {
            id: "q3",
            prompt: "Why do editors often write the hook last, even though it's shown first?",
            options: ["It's a superstition", "It's easier to write a sharp hook once you know exactly what the video delivers", "Software requires it", "It saves render time"],
            correctIndex: 1,
            explanation: "Writing the hook after the full script exists means it can promise exactly what the video actually delivers.",
          },
        ],
        explainBack: {
          concept: "The Hook's Single Job",
          prompt: "Explain why a hook should focus on earning the next few seconds of attention rather than trying to summarize the whole video.",
          followUpQuestion: "A creator's hook says 'In this video I'll cover 5 tips about X' and view-through rate is low. What's the likely problem and how would you rewrite the approach?",
          passFeedback: "Right — listing everything upfront removes curiosity; a sharper hook would tease one specific, surprising tip instead of summarizing all five.",
          needsImprovementFeedback: "You identified the hook was too generic, but the rewrite needed to specifically address why listing all 5 tips kills the curiosity gap.",
        },
      }),
      stage("content-creation", {
        id: "cc-3",
        order: 3,
        title: "Short-Form Video Editing",
        description: "Pacing, cuts, captions, and keeping retention high through the whole video.",
        status: "active",
        meta: "4 lessons · 1 quiz · explain-back gate",
        lesson: { title: "Pacing & Cut Rhythm", duration: "13 min" },
        resource: {
          title: "Editing for retention in short-form video",
          url: "https://www.descript.com/blog/article/short-form-video-editing-tips",
          source: "Descript",
          length: "16 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "What is a 'retention graph' used for?",
            options: ["Measuring follower count", "Showing where viewers drop off during a video", "Tracking video file size", "Scheduling posts"],
            correctIndex: 1,
            explanation: "A retention graph plots what percentage of viewers are still watching at each timestamp, revealing exactly where they leave.",
          },
          {
            id: "q2",
            prompt: "Cutting out dead air and filler words mainly helps with what?",
            options: ["Audio quality", "Keeping pacing tight so attention doesn't drift", "File compression", "Thumbnail generation"],
            correctIndex: 1,
            explanation: "Removing dead space keeps the pace tight, which is one of the biggest levers for holding attention in short-form video.",
          },
          {
            id: "q3",
            prompt: "Why are burned-in captions commonly used in short-form video?",
            options: ["Legal requirement", "Many viewers watch with sound off", "They reduce video length", "They're required by every platform's algorithm"],
            correctIndex: 1,
            explanation: "A large share of short-form viewing happens muted, so captions keep the message accessible without sound.",
          },
        ],
        explainBack: {
          concept: "Reading a Retention Graph",
          prompt: "Explain what a sharp drop at a specific timestamp in a retention graph tells you, and what you'd do about it.",
          followUpQuestion: "The retention graph shows a steep drop right at the 8-second mark, immediately after the hook ends. What's the most likely cause, and what would you check first in the edit?",
          passFeedback: "Correct — a drop right after the hook usually means the transition into the main content is slow or the hook over-promised; checking the pacing right at that cut is the right first move.",
          needsImprovementFeedback: "You correctly read the graph as a drop-off point, but the diagnosis needed to connect it specifically to the hook-to-content transition rather than a general pacing issue.",
        },
      }),
      stage("content-creation", {
        id: "cc-4",
        order: 4,
        title: "Growing & Analyzing an Audience",
        description: "Reading analytics, iterating on formats, and building consistency.",
        status: "locked",
        meta: "3 lessons · 1 quiz · explain-back gate",
        unlockHint: 'Complete the explain-back check on "Short-Form Video Editing" to unlock.',
        lesson: { title: "Reading Your Analytics Dashboard", duration: "11 min" },
        resource: {
          title: "A creator's guide to platform analytics",
          url: "https://creatoreconomy.so/p/how-to-read-your-analytics",
          source: "The Creator Economy",
          length: "13 min read",
        },
        quiz: [
          {
            id: "q1",
            prompt: "If average view duration is low but reach is high, what does that most likely point to?",
            options: ["The thumbnail is bad", "The hook or early content isn't holding attention", "The posting time is wrong", "The audio is too quiet"],
            correctIndex: 1,
            explanation: "High reach with low watch time means the platform is showing it to people, but the content itself isn't holding them.",
          },
          {
            id: "q2",
            prompt: "What's the value of posting consistently on a regular schedule?",
            options: ["It guarantees virality", "It gives the algorithm and audience a predictable signal to build habits around", "It's required to unlock analytics", "It reduces editing time"],
            correctIndex: 1,
            explanation: "Consistency builds audience habits and gives the algorithm a steady signal — it doesn't guarantee virality on its own.",
          },
          {
            id: "q3",
            prompt: "When a specific video format outperforms your average, what's the recommended next step?",
            options: ["Never repeat that format", "Iterate on that format with variations to test if it's repeatable", "Delete the underperforming videos", "Switch platforms immediately"],
            correctIndex: 1,
            explanation: "Testing variations on a winning format tells you whether the result was a pattern or a one-off, before over-committing to it.",
          },
        ],
        explainBack: {
          concept: "Diagnosing a Metric, Not Just Reading It",
          prompt: "Explain the difference between reach and retention, and why a creator needs both numbers together to diagnose a problem.",
          followUpQuestion: "A video has high reach but only 20% average retention. Someone suggests changing the thumbnail. Is that the right fix — why or why not?",
          passFeedback: "Correct — the thumbnail affects whether people click (reach), not whether they stay once watching, so the fix needs to target the hook or pacing instead.",
          needsImprovementFeedback: "You separated reach and retention correctly, but didn't clearly explain why the thumbnail fix specifically wouldn't address a retention problem.",
        },
      }),
    ],
  },
];

export const stats = (() => {
  const allStages = skills.flatMap((s) => s.stages);
  const doneCount = allStages.filter((s) => s.status === "done").length;
  return {
    currentStreak: 6,
    longestStreak: 14,
    skillsInProgress: skills.filter((s) => s.stages.some((st) => st.status === "active")).length,
    milestonesPassed: doneCount,
    quizzesCompleted: doneCount,
  };
})();

export const masteryGrowth: Array<Record<string, string | number>> = [
  { label: "Wk 1", "full-stack-web-dev": 5, "art-painting": 0, "content-creation": 20 },
  { label: "Wk 2", "full-stack-web-dev": 14, "art-painting": 2, "content-creation": 38 },
  { label: "Wk 3", "full-stack-web-dev": 22, "art-painting": 4, "content-creation": 50 },
  { label: "Wk 4", "full-stack-web-dev": 30, "art-painting": 7, "content-creation": 58 },
  { label: "Wk 5", "full-stack-web-dev": 37, "art-painting": 10, "content-creation": 63 },
  { label: "Wk 6", "full-stack-web-dev": 42, "art-painting": 12, "content-creation": 68 },
];

export const weakTopics: WeakTopic[] = [
  {
    id: "wt-1",
    topic: "CSS Box Model (border-box)",
    skill: "Full-Stack Web Development",
    detail: "Quiz score",
    accuracy: 62,
    severity: "medium",
    stageId: "fswd-1",
  },
  {
    id: "wt-2",
    topic: "Event Delegation",
    skill: "Full-Stack Web Development",
    detail: "Quiz score",
    accuracy: 55,
    severity: "medium",
    stageId: "fswd-2",
  },
  {
    id: "wt-3",
    topic: "Line of Action",
    skill: "Art & Painting",
    detail: "Explain-back check",
    accuracy: 40,
    severity: "high",
    stageId: "art-1",
  },
  {
    id: "wt-4",
    topic: "Retention Graph Diagnosis",
    skill: "Content Creation",
    detail: "Quiz score",
    accuracy: 71,
    severity: "medium",
    stageId: "cc-3",
  },
];

export const user = {
  name: "Alex Rivera",
  handle: "alexrivera",
  email: "alex@skillflow.dev",
};

export const comingSoonSkills = [
  { label: "Data Science", description: "Python, statistics, and real-world datasets.", icon: "database" },
  { label: "Photography", description: "Composition, lighting, and post-processing.", icon: "camera" },
  { label: "Music Production", description: "Beat-making, mixing, and arrangement.", icon: "music" },
];

export function getSkillBySlug(slug: string): MockSkill | undefined {
  return skills.find((s) => s.slug === slug);
}

export function getStageById(stageId: string): MockStage | undefined {
  return skills.flatMap((s) => s.stages).find((st) => st.id === stageId);
}

export function getSkillForStage(stageId: string): MockSkill | undefined {
  return skills.find((s) => s.stages.some((st) => st.id === stageId));
}

export function getNextStage(stageId: string): MockStage | undefined {
  const skill = getSkillForStage(stageId);
  if (!skill) return undefined;
  const i = skill.stages.findIndex((st) => st.id === stageId);
  return i >= 0 ? skill.stages[i + 1] : undefined;
}

export function getActiveStage(): { stage: MockStage; skill: MockSkill } | undefined {
  for (const skill of skills) {
    const active = skill.stages.find((st) => st.status === "active");
    if (active) return { stage: active, skill };
  }
  return undefined;
}
