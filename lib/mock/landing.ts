export type LandingCta = {
  href: string;
  label: string;
};

export type LandingLink = {
  href: string;
  label: string;
};

export type LandingStage = {
  index: string;
  title: string;
  status: string;
  locked: boolean;
};

export type LandingFeature = {
  id: string;
  title: string;
  body: string;
  points: string[];
  mediaLabel: string;
};

export type LandingFact = {
  value: string;
  label: string;
};

export type LandingProblemPoint = {
  icon: string;
  title: string;
  body: string;
};

export type LandingStep = {
  index: string;
  title: string;
  body: string;
};

export type LandingSkill = {
  title: string;
  body: string;
};

export type LandingReview = {
  id: string;
  title: string;
  quote: string;
  name: string;
  skill: string;
  rating: number;
};

export type LandingContent = {
  wordmark: string;
  nav: LandingLink[];
  loginCta: LandingCta;
  startCta: LandingCta;
  heroSecondary: LandingCta;
  heroNote: string;
  eyebrow: string;
  headline: string;
  lead: string;
  primaryCta: LandingCta;
  secondaryCta: LandingCta;
  skillsNote: string;
  preview: {
    skill: string;
    caption: string;
    stages: LandingStage[];
  };
  factsCaption: string;
  facts: LandingFact[];
  problemTitle: string;
  problemBody: string;
  problemPoints: LandingProblemPoint[];
  featuresTitle: string;
  featuresSubtitle: string;
  features: LandingFeature[];
  stepsTitle: string;
  stepsSubtitle: string;
  steps: LandingStep[];
  aboutTitle: string;
  aboutSubtitle: string;
  aboutBody: string;
  aboutSkills: LandingSkill[];
  reviewsTitle: string;
  reviewsSubtitle: string;
  reviews: LandingReview[];
  closingTitle: string;
  closingBody: string;
  footerBlurb: string;
};

/** Placeholder landing copy. Swap this function when the page reads real content. */
export function getLandingContent(): LandingContent {
  return {
    wordmark: "SkillFlow",
    nav: [
      { href: "#home", label: "Home" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#features", label: "Features" },
      { href: "#skills", label: "Skills" },
      { href: "#reviews", label: "Reviews" },
      { href: "#about", label: "About" },
      { href: "#faq", label: "FAQ" },
    ],
    loginCta: { href: "/login", label: "Log in" },
    startCta: { href: "/signup", label: "Get started" },
    heroSecondary: { href: "#how-it-works", label: "See how it works" },
    heroNote: "Free to start. No credit card required.",
    eyebrow: "Mastery-first learning",
    headline: "Prove you understood it, not just that you watched it.",
    lead: "SkillFlow turns scattered tutorials into one structured roadmap, checks your understanding with quizzes built from the lesson you just studied, and unlocks each stage only when you can explain the concept in your own words.",
    primaryCta: { href: "/signup", label: "Create an account" },
    secondaryCta: { href: "/login", label: "Sign in" },
    skillsNote: "Full-Stack Web Development · Art & Painting · Content Creation",
    preview: {
      skill: "Full-Stack Web Development",
      caption: "Illustrative",
      stages: [
        {
          index: "01",
          title: "React fundamentals",
          status: "Active",
          locked: false,
        },
        {
          index: "02",
          title: "Auth and databases",
          status: "Locked",
          locked: true,
        },
      ],
    },
    factsCaption: "How SkillFlow is built, not how many people use it.",
    facts: [
      { value: "3", label: "Flagship skills at launch" },
      { value: "2", label: "Checks per milestone: a quiz and an explain-back" },
      { value: "100%", label: "Of quiz questions built from the lesson you just studied" },
      { value: "0", label: "Comments, likes, or trending counters" },
    ],
    problemTitle: "Watching a tutorial is not the same as learning it.",
    problemBody:
      "Learning a skill today means jumping between video sites, documentation, and random blogs, with no clear order, no check that anything stuck, and feeds designed to keep you watching rather than learning. SkillFlow replaces that with one path, one order, and proof that you understood each step.",
    problemPoints: [
      {
        icon: "route",
        title: "No structure",
        body: "nobody tells you what comes next.",
      },
      {
        icon: "video-off",
        title: "No verification",
        body: "finishing a video proves nothing.",
      },
      {
        icon: "focus",
        title: "No focus",
        body: "engagement-driven feeds pull you off course.",
      },
    ],
    featuresTitle: "What you do here",
    featuresSubtitle: "Three parts of the work. The pictures and clips for each one come later.",
    features: [
      {
        id: "explain-back",
        title: "Explain it back",
        body: "At each milestone you say what you understood. A thin answer gets one or two follow-up questions, and the next stage opens on a genuine pass.",
        points: [
          "Write it, or speak it",
          "The follow-up stays on the vague part",
          "A pass is the only key to the next stage",
        ],
        mediaLabel: "Explain-back",
      },
      {
        id: "roadmap",
        title: "One roadmap per skill",
        body: "Full-stack, painting, and content technique each keep their own row. Stages stay in order, and a locked stage shows the condition that opens it.",
        points: [
          "Skills are never blended into one feed",
          "Stages open in order",
          "A lock states the exact condition",
        ],
        mediaLabel: "Roadmap",
      },
      {
        id: "quiz",
        title: "A quiz on the material",
        body: "After the resource, you get one question at a time. A miss comes with an explanation of that material, not a separate course.",
        points: [
          "One question on screen",
          "An explanation when the answer misses",
          "Tied to the resource you just used",
        ],
        mediaLabel: "Quiz",
      },
    ],
    stepsTitle: "How you use it",
    stepsSubtitle: "Four steps. The last one is the one that opens the next stage.",
    steps: [
      {
        index: "01",
        title: "Choose a skill",
        body: "Pick one of the three flagship skills and the level you are starting from.",
      },
      {
        index: "02",
        title: "Work the stage",
        body: "Each stage points you at a real resource. The link is marked as external.",
      },
      {
        index: "03",
        title: "Take the quiz",
        body: "One question at a time, on that material, with an explanation when you miss.",
      },
      {
        index: "04",
        title: "Explain it back",
        body: "Say what you understood. A genuine pass is what unlocks the following stage.",
      },
    ],
    aboutTitle: "About SkillFlow",
    aboutSubtitle: "A single system for learning that can be checked.",
    aboutBody:
      "Lessons usually live across videos, docs, and posts, and none of them ask whether the idea actually landed. SkillFlow lines a skill into one roadmap, checks the resource with a quiz, and then reviews your explanation before the next stage opens. The skills that are ready were chosen because their fundamentals can be tested.",
    aboutSkills: [
      {
        title: "Full-stack web development",
        body: "The technical path: the pieces you have to be able to explain, from the interface through the data.",
      },
      {
        title: "Painting fundamentals",
        body: "Color, perspective, anatomy, composition, and medium. Technique that can be described and checked.",
      },
      {
        title: "Content technique",
        body: "Editing, platform mechanics, camera and audio, and analytics. The craft, kept separate from the feed.",
      },
    ],
    reviewsTitle: "What learners say",
    reviewsSubtitle: "Notes from people working through a roadmap. The row advances on its own.",
    reviews: [
      {
        id: "web",
        title: "It waited until I could explain it",
        quote: "The foreign-key stage stayed closed until I could say what happens on delete. That was the first time the next lesson waited for me.",
        name: "A. Rahman",
        skill: "Full-stack web development",
        rating: 5,
      },
      {
        id: "paint",
        title: "The follow-up was specific",
        quote: "I wrote that a shadow is just darker. The question asked where the color of the light showed up. I had skipped that part.",
        name: "Elena Voss",
        skill: "Painting fundamentals",
        rating: 5,
      },
      {
        id: "content",
        title: "The quiz stayed on the lesson",
        quote: "It asked which part of the edit was the hook and which part was retention. Not whether the video performed.",
        name: "Jonah Adeyemi",
        skill: "Content technique",
        rating: 4,
      },
      {
        id: "rows",
        title: "The skills stay separate",
        quote: "Painting never got mixed into the web roadmap. Each skill has its own row, and I can see what is still locked.",
        name: "Priya Nair",
        skill: "Painting fundamentals",
        rating: 5,
      },
      {
        id: "pass",
        title: "A pass felt like a real check",
        quote: "I did not get a score to chase. I got a note on what was missing, and the stage opened once the explanation held.",
        name: "Chris Lang",
        skill: "Full-stack web development",
        rating: 5,
      },
      {
        id: "voice",
        title: "I could say it out loud",
        quote: "Typing the first explanation was stiff. Speaking the follow-up was closer to how I actually understood the idea.",
        name: "Maya Ortiz",
        skill: "Content technique",
        rating: 4,
      },
    ],
    closingTitle: "Start with one skill.",
    closingBody: "Create an account to choose a skill, or sign in if you already have one.",
    footerBlurb:
      "Mastery-first roadmaps for full-stack web development, painting fundamentals, and content technique.",
  };
}
