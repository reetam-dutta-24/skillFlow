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
  image?: string;
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

export type LandingSkillCard = {
  title: string;
  body: string;
  available: boolean;
  image: string;
};

export type LandingCheck = {
  label: string;
  title: string;
  question: string;
  answer: string;
  followUp: string;
  result: string;
  caption: string;
};

export type LandingReview = {
  id: string;
  title: string;
  quote: string;
  name: string;
  skill: string;
  rating: number;
};

export type LandingFooterLink = {
  label: string;
  href: string;
};

export type LandingFooterColumn = {
  title: string;
  links: LandingFooterLink[];
};

export type LandingFaq = {
  question: string;
  answer: string;
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
  check: LandingCheck;
  skillsTitle: string;
  skillCards: LandingSkillCard[];
  upcomingSkills: LandingSkillCard[];
  aboutTitle: string;
  aboutBody: string;
  aboutStack: string;
  aboutGithubLabel: string;
  aboutGithubUrl: string;
  aboutSkills: LandingSkill[];
  reviewsTitle: string;
  reviewsSubtitle: string;
  reviews: LandingReview[];
  faqTitle: string;
  faq: LandingFaq[];
  closingTitle: string;
  closingNote: string;
  footerBlurb: string;
  footerCredit: string;
  footerColumns: LandingFooterColumn[];
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
      { href: "#open-source", label: "Open Source" },
      { href: "#about", label: "About" },
      { href: "#faq", label: "FAQ" },
    ],
    loginCta: { href: "/login", label: "Log in" },
    startCta: { href: "/signup", label: "Get started" },
    heroSecondary: { href: "#how-it-works", label: "See how it works" },
    heroNote: "Thirty paths are free. Premium is one subscription.",
    eyebrow: "Mastery-first learning",
    headline: "Prove you understood it, not just that you watched it.",
    lead: "Thirty free paths, every stage, and an explain-back that asks for one idea at a time. Pass it, and the next stage opens. Notes, nearby events, and Open Source stay free. Premium opens the other niches and a place on the learner map.",
    primaryCta: { href: "/signup", label: "Create an account" },
    secondaryCta: { href: "/login", label: "Sign in" },
    skillsNote: "Thirty free paths, including Full-Stack Web Development, Travel Vlogging, and Content Creation.",
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
    factsCaption: "What the product is, not how many people use it.",
    facts: [
      { value: "30", label: "Free paths, every stage, and a certificate when the path is finished" },
      { value: "1", label: "Idea at a time in the explain-back. There is no quiz." },
      { value: "Open", label: "Source posts go public only after a moderator publishes them" },
      { value: "0", label: "Comments, likes, or view counts" },
    ],
    problemTitle: "Watching a tutorial is not the same as learning it.",
    problemBody:
      "Learning a skill today means jumping between video sites, documentation, and random blogs, with no clear order and no check that anything stuck. SkillFlow keeps one path, one order, and a written explain-back before the next stage opens.",
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
        body: "comments, likes, and view counts pull you off the work.",
      },
    ],
    featuresTitle: "Features",
    featuresSubtitle: "",
    features: [
      {
        id: "explain-back",
        title: "Explain-back",
        body: "Each stage asks for one idea at a time, taken from that stage’s resources. A sound answer is saved as a note and the next idea opens. The stage is recorded only after every idea has passed. A thin answer stays on that idea. There is no quiz.",
        points: [],
        mediaLabel: "Explain-back on a stage",
        image: "/landing/shots/explain.jpg",
      },
      {
        id: "roadmap",
        title: "Thirty free paths",
        body: "Every stage on a free path is open to read. The next one still waits until the explain-back on this one is passed. Follow a path from Niches, Home, or Paths. A personal plan can turn that path into weeks, and saving the plan follows it.",
        points: [],
        mediaLabel: "A path of stages",
        image: "/landing/shots/roadmap.jpg",
      },
      {
        id: "open-source",
        title: "Open Source",
        body: "A learner submits a resource, a concept note, a learning path, or an account to follow. A moderator publishes it, and only then is it public. A published post has one question per learner and one answer from the author. No thread, no likes, and no view count.",
        points: [],
        mediaLabel: "Open Source contributions",
        image: "/landing/shots/open-source.jpg",
      },
      {
        id: "notes",
        title: "Notes and practice",
        body: "An idea that holds is kept under Notes and can be downloaded as Word or PDF. Practice grades an explanation against a public page, a text file, or pasted text. That note does not pass a stage.",
        points: [],
        mediaLabel: "Notes from an explain-back",
        image: "/landing/shots/notes.jpg",
      },
      {
        id: "nearby",
        title: "Nearby events and the learner map",
        body: "Events near the city you save are free: Ticketmaster, Google, and community submissions. Links only, nothing books a ticket. Appearing on the learner map is Premium. The map shows city counts, never a name or a pin per person.",
        points: [],
        mediaLabel: "Nearby events",
        image: "/landing/shots/nearby.jpg",
      },
      {
        id: "record",
        title: "A record of what you passed",
        body: "Progress is the share of stages with a passed explain-back. A transcript lists those stages and their dates. A certificate appears when every stage on the path is passed. It is SkillFlow’s own record, not a license or a degree.",
        points: [],
        mediaLabel: "Progress across followed paths",
        image: "/landing/shots/progress.jpg",
      },
    ],
    stepsTitle: "How it works",
    stepsSubtitle: "",
    steps: [
      {
        index: "01",
        title: "Follow a path",
        body: "Thirty paths are free, including every stage. Premium niches open with a subscription.",
      },
      {
        index: "02",
        title: "Work the stage",
        body: "Each stage is a set of real external resources, in order. Clips from those stages sit in their own lane.",
      },
      {
        index: "03",
        title: "Explain one idea",
        body: "The explain-back walks the ideas from that stage. A sound answer is reviewed, saved as a note, and the next idea opens.",
      },
      {
        index: "04",
        title: "Keep the record",
        body: "The stage is recorded after every idea has passed. Finish the path and the certificate is there. A passed idea also comes back later, so it stays.",
      },
    ],
    check: {
      label: "Example. One idea at a time.",
      title: "The check is an explanation, not a quiz.",
      question: "Why does useEffect need a dependency array?",
      answer: "It lists the values the effect reads. React re-runs the effect when one of those values changes.",
      followUp: "That holds. The array is the list of values this effect reads from the render.",
      result: "Saved as a note. The next idea opens. The stage is recorded only after every idea has passed.",
      caption: "There is no quiz and no score. A thin answer stays on the idea.",
    },
    skillsTitle: "Start with a skill worth mastering.",
    skillCards: [
      {
        title: "Full-Stack Web Development",
        body: "From React fundamentals to auth and databases.",
        available: true,
        image: "/skills/web.jpg",
      },
      {
        title: "Travel Vlogging",
        body: "Shoot planning, a travel kit, location audio, and the rules of filming people and places.",
        available: true,
        image: "/skills/travel-vlogging.jpg",
      },
      {
        title: "Content Creation",
        body: "Plan, shoot, edit, and publish video that holds attention.",
        available: true,
        image: "/skills/content.jpg",
      },
    ],
    upcomingSkills: [
      { title: "Photography", body: "Exposure, focus, light, and a finished photograph.", available: true, image: "/skills/photo.jpg" },
      { title: "Music Production", body: "A track, a mix, and a master you can explain.", available: true, image: "/skills/music.jpg" },
    ],
    aboutTitle: "Why SkillFlow exists.",
    aboutBody:
      "SkillFlow is an independent project by Reetam Dutta, built around one belief: watching something is not the same as understanding it. It does not replace the docs, courses, and videos it links. It puts them in order and asks you to explain each stage before the next one opens.",
    aboutStack: "Built with Next.js, TypeScript, PostgreSQL, and Prisma.",
    aboutGithubLabel: "View the project on GitHub",
    aboutGithubUrl: "https://github.com/reetam-dutta-24/skillFlow",
    aboutSkills: [
      {
        title: "Full-stack web development",
        body: "The technical path: the pieces you have to be able to explain, from the interface through the data.",
      },
      {
        title: "Travel vlogging",
        body: "Planning a shoot, the travel kit, location audio, and the rules of filming people and places.",
      },
      {
        title: "Content technique",
        body: "Editing, platform mechanics, camera and audio, and analytics. The craft, kept separate from the feed.",
      },
    ],
    reviewsTitle: "Open Source",
    reviewsSubtitle: "Published contributions from the paths. A moderator publishes a post before it appears here. The row advances on its own.",
    reviews: [
      {
        id: "cut",
        title: "Cut on action, not on boredom",
        quote: "Change the shot when something moves, not when you are tired of the frame.",
        name: "Travel Vlogging",
        skill: "Concept note",
        rating: 0,
      },
      {
        id: "music",
        title: "Music you are allowed to use",
        quote: "A track you like is not a track you can publish. Start from a library that states the license.",
        name: "Travel Vlogging",
        skill: "Resource",
        rating: 0,
      },
      {
        id: "voice",
        title: "Voiceover that doesn’t drone",
        quote: "Write it after the cut, then record in a quiet room. Picture first, words second.",
        name: "Travel Vlogging",
        skill: "Learning path",
        rating: 0,
      },
      {
        id: "battery",
        title: "Battery, cards, and a boring backup",
        quote: "The glamorous failure is a full card at the one moment that mattered. Copy footage before you sleep.",
        name: "Travel Vlogging",
        skill: "Concept note",
        rating: 0,
      },
      {
        id: "archive",
        title: "The Internet Archive’s travel films",
        quote: "Older footage is a reminder that the place existed before the channel.",
        name: "Travel Vlogging",
        skill: "Follow",
        rating: 0,
      },
      {
        id: "consent",
        title: "Consent in a public place",
        quote: "A crowd is not a release form. Faces you feature, and anyone you interview, should know they are in the piece.",
        name: "Travel Vlogging",
        skill: "Concept note",
        rating: 0,
      },
    ],
    faqTitle: "FAQ",
    faq: [
      {
        question: "Is SkillFlow free?",
        answer:
          "Thirty paths are free, including every stage, the explain-back, notes, nearby events, and Open Source. Premium is one subscription. It opens the niches outside those thirty and lets you appear on the learner map. The card form stays on Stripe.",
      },
      {
        question: "How is this different from YouTube or a course site?",
        answer:
          "SkillFlow does not host a replacement course. It orders real resources into a path and asks you to explain each stage before the next one opens.",
      },
      {
        question: "What happens if an explanation is thin?",
        answer: "You stay on that idea and see a written review. Nothing is saved until the explanation holds. There is no quiz to retry.",
      },
      {
        question: "Where do the explain-back questions come from?",
        answer: "From that stage’s resources, one idea at a time. A page the site blocks is skipped. With no model key, the questions already in the catalog stay.",
      },
      {
        question: "Can I suggest resources?",
        answer: "Yes. Admin reviews them before they appear on a roadmap.",
      },
      {
        question: "Is my account secure?",
        answer: "Passwords are hashed before storage and never kept in plain text.",
      },
    ],
    closingTitle: "Stop collecting tutorials. Start mastering skills.",
    closingNote: "Thirty paths are free. Premium is one subscription.",
    footerBlurb: "Thirty free paths, an explain-back on every stage, and Open Source after review.",
    footerCredit: "Built by Reetam Dutta.",
    footerColumns: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "#features" },
          { label: "How it works", href: "#how-it-works" },
          { label: "Skills", href: "#skills" },
          { label: "FAQ", href: "#faq" },
        ],
      },
      {
        title: "Skills",
        links: [
          { label: "Full-Stack Web Development", href: "#skills" },
          { label: "Travel Vlogging", href: "#skills" },
          { label: "Content Creation", href: "#skills" },
        ],
      },
      {
        title: "Project",
        links: [
          { label: "About", href: "#about" },
          { label: "GitHub", href: "https://github.com/reetam-dutta-24/skillFlow" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" },
        ],
      },
    ],
  };
}
