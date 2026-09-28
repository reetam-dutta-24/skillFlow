import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AboutSection } from "@/components/landing/AboutSection.jsx";
import { ClosingCta } from "@/components/landing/ClosingCta.jsx";
import { ExplainBackPreview } from "@/components/landing/ExplainBackPreview.jsx";
import { FeatureGrid } from "@/components/landing/FeatureGrid.jsx";
import { HowItWorks } from "@/components/landing/HowItWorks.jsx";
import { LandingFacts } from "@/components/landing/LandingFacts.jsx";
import { LandingFooter } from "@/components/landing/LandingFooter.jsx";
import { LandingHero } from "@/components/landing/LandingHero.jsx";
import { LandingNav } from "@/components/landing/LandingNav.jsx";
import { PracticeSlider } from "@/components/landing/PracticeSlider.jsx";
import { SkillsSection } from "@/components/landing/SkillsSection.jsx";
import { ProblemSection } from "@/components/landing/ProblemSection.jsx";
import { getLandingContent } from "@/lib/mock/landing";
import { resolveTheme, THEME_STORAGE_KEY } from "@/lib/theme";

const description =
  "Structured roadmaps, grounded quizzes, and a check that asks you to explain concepts in your own words. Full-Stack Web Development, Art & Painting, and Content Creation.";

export const metadata: Metadata = {
  title: { absolute: "SkillFlow: Learn by proving you understood it" },
  description,
  openGraph: {
    title: "SkillFlow: Learn by proving you understood it",
    description,
  },
};

export default async function Home() {
  const cookieStore = await cookies();
  const theme = resolveTheme(cookieStore.get(THEME_STORAGE_KEY)?.value);
  const content = getLandingContent();

  return (
    <>
      <LandingNav
        wordmark={content.wordmark}
        links={content.nav}
        loginCta={content.loginCta}
        startCta={content.startCta}
        defaultTheme={theme}
      />
      <main className="sf-landing">
        <LandingHero content={content} />
        <LandingFacts caption={content.factsCaption} facts={content.facts} />
        <ProblemSection title={content.problemTitle} body={content.problemBody} points={content.problemPoints} />
        <HowItWorks title={content.stepsTitle} subtitle={content.stepsSubtitle} steps={content.steps} />
        <ExplainBackPreview check={content.check} />
        <FeatureGrid
          title={content.featuresTitle}
          subtitle={content.featuresSubtitle}
          features={content.features}
        />
        <SkillsSection title={content.skillsTitle} skills={content.skillCards} upcoming={content.upcomingSkills} />
        <AboutSection
          title={content.aboutTitle}
          subtitle={content.aboutSubtitle}
          body={content.aboutBody}
          skills={content.aboutSkills}
        />
        <PracticeSlider
          title={content.reviewsTitle}
          subtitle={content.reviewsSubtitle}
          reviews={content.reviews}
        />
        <ClosingCta
          title={content.closingTitle}
          body={content.closingBody}
          primaryCta={content.primaryCta}
          secondaryCta={content.secondaryCta}
        />
      </main>
      <LandingFooter
        wordmark={content.wordmark}
        blurb={content.footerBlurb}
        links={content.nav}
        primaryCta={content.primaryCta}
        secondaryCta={content.secondaryCta}
        skills={content.aboutSkills.map((skill) => skill.title)}
      />
    </>
  );
}
