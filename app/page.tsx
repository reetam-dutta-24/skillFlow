import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Explain it, then continue · SkillFlow",
  description:
    "SkillFlow keeps the next stage closed until you can explain the last one. Curated roadmaps, a quiz on the material, and a Socratic explain-back at every milestone.",
};

export default function Home() {
  const content = getLandingContent();

  return (
    <>
      <LandingNav
        wordmark={content.wordmark}
        links={content.nav}
        primaryCta={content.primaryCta}
        secondaryCta={content.secondaryCta}
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
      />
    </>
  );
}
