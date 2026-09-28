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

export type LandingExchange = {
  you: string;
  followUp: string;
};

export type LandingFeature = {
  id: string;
  icon: string;
  title: string;
  body: string;
  lead?: boolean;
  exchange?: LandingExchange;
};

export type LandingFact = {
  value: string;
  label: string;
  detail: string;
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
  skill: string;
  stage: string;
  explanation: string;
  followUp: string;
  note: string;
};

export type LandingContent = {
  wordmark: string;
  nav: LandingLink[];
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
  factsTitle: string;
  factsSubtitle: string;
  facts: LandingFact[];
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
      { href: "#features", label: "Features" },
      { href: "#how", label: "How it works" },
      { href: "#about", label: "About" },
      { href: "#reviews", label: "Reviews" },
    ],
    eyebrow: "Explain-back gate",
    headline: "Nothing moves on until you can explain it.",
    lead: "SkillFlow puts real lessons on one roadmap and checks them with a short quiz. At each milestone you explain the idea in your own words. A thin answer gets one or two follow-up questions. The next stage opens only after a genuine pass.",
    primaryCta: { href: "/signup", label: "Create an account" },
    secondaryCta: { href: "/login", label: "Sign in" },
    skillsNote:
      "Three skills are ready: full-stack web development, painting fundamentals, and content technique.",
    preview: {
      skill: "Painting fundamentals",
      caption: "Perspective stays closed until the color-theory explanation holds.",
      stages: [
        {
          index: "02",
          title: "Color relationships",
          status: "Explain-back open",
          locked: false,
        },
        {
          index: "03",
          title: "Perspective",
          status: "Opens after you explain color relationships",
          locked: true,
        },
      ],
    },
    factsTitle: "The system, in numbers",
    factsSubtitle: "These count how SkillFlow is built. Mastery is what grows after a pass.",
    facts: [
      {
        value: "3",
        label: "Flagship skills",
        detail: "Full-stack web development, painting fundamentals, and content technique.",
      },
      {
        value: "2",
        label: "Checks at a milestone",
        detail: "A quiz on the resource you just used, then the explain-back.",
      },
      {
        value: "1",
        label: "Roadmap per skill",
        detail: "Stages stay in their own row and open in order.",
      },
      {
        value: "1–2",
        label: "Follow-up questions",
        detail: "Asked only when the explanation is vague or incomplete.",
      },
    ],
    featuresTitle: "What the work actually is",
    featuresSubtitle:
      "A roadmap, a check against the material, and a short conversation before the next stage.",
    features: [
      {
        id: "explain-back",
        icon: "message-square-quote",
        title: "Explain it back",
        lead: true,
        body: "You write or speak what you understood. The follow-up asks only about the part that was vague. You pass with specific notes, or you stay on this stage until the explanation holds.",
        exchange: {
          you: "A cast shadow is darker, so I just lower the value.",
          followUp:
            "The lesson said the shadow also takes on the color of the surrounding light. Where does that show up in what you wrote?",
        },
      },
      {
        id: "roadmap",
        icon: "route",
        title: "One roadmap per skill",
        body: "Full-stack, painting, and content technique each stay in their own row. Stages are in order. A locked stage shows the exact condition that opens it.",
      },
      {
        id: "quiz",
        icon: "list-checks",
        title: "A quiz on what you just used",
        body: "One question at a time, with an explanation when the answer misses. It checks the resource you were given. It is not a separate course.",
      },
      {
        id: "scope",
        icon: "layers",
        title: "Skills with a real scope",
        body: "Painting here means color, perspective, anatomy, composition, and medium. Content creation means editing, platform mechanics, camera and audio, and analytics. Anything not ready is marked coming soon.",
      },
      {
        id: "record",
        icon: "gauge",
        title: "A record of what held",
        body: "You can see mastery on a skill, milestones passed, and topics that are still thin. There is no feed, and nothing here counts likes or views.",
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
    reviewsTitle: "Milestone reviews",
    reviewsSubtitle:
      "Sample exchanges from the three skills. Each one shows the explanation, then the question the review asks next.",
    reviews: [
      {
        id: "web",
        skill: "Full-stack web development",
        stage: "Foreign keys",
        explanation: "A foreign key means this row points at a row in another table.",
        followUp: "What happens to this row if the one it points at is deleted?",
        note: "The follow-up stays on the part the explanation left out.",
      },
      {
        id: "paint",
        skill: "Painting fundamentals",
        stage: "Color relationships",
        explanation: "A cast shadow is darker, so I just lower the value.",
        followUp:
          "The lesson said the shadow also takes on the color of the surrounding light. Where does that show up in what you wrote?",
        note: "A pass has to account for the idea in the lesson.",
      },
      {
        id: "content",
        skill: "Content technique",
        stage: "Retention and the hook",
        explanation: "The first three seconds should be loud so people stay.",
        followUp: "The lesson separated a hook from retention. Which part of the edit is doing which job?",
        note: "The review asks about the technique the lesson taught.",
      },
    ],
    closingTitle: "Start with one skill.",
    closingBody: "Create an account to choose a skill, or sign in if you already have one.",
    footerBlurb:
      "Mastery-first roadmaps for full-stack web development, painting fundamentals, and content technique.",
  };
}
