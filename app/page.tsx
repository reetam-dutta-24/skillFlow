import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AboutSection } from "@/components/landing/AboutSection.jsx";
import { ClosingCta } from "@/components/landing/ClosingCta.jsx";
import { FeatureGrid } from "@/components/landing/FeatureGrid.jsx";
import { HowItWorks } from "@/components/landing/HowItWorks.jsx";
import { LandingFacts } from "@/components/landing/LandingFacts.jsx";
import { LandingFooter } from "@/components/landing/LandingFooter.jsx";
import { LandingHero } from "@/components/landing/LandingHero.jsx";
import { LandingNav } from "@/components/landing/LandingNav.jsx";
import { PracticeSlider } from "@/components/landing/PracticeSlider.jsx";
import { getLandingContent } from "@/lib/mock/landing";
import { resolveTheme, THEME_STORAGE_KEY } from "@/lib/theme";

export const metadata: Metadata = {
  title: "One place to learn a skill · SkillFlow",
  description:
    "SkillFlow is a mastery-first system for full-stack web development, painting fundamentals, and content technique.",
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
        primaryCta={content.primaryCta}
        secondaryCta={content.secondaryCta}
        defaultTheme={theme}
      />
      <main className="sf-landing">
        <LandingHero content={content} />
        <LandingFacts title={content.factsTitle} subtitle={content.factsSubtitle} facts={content.facts} />
        <FeatureGrid
          title={content.featuresTitle}
          subtitle={content.featuresSubtitle}
          features={content.features}
        />
        <HowItWorks title={content.stepsTitle} subtitle={content.stepsSubtitle} steps={content.steps} />
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
