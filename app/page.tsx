import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AboutSection } from "@/components/landing/AboutSection.jsx";
import { ClosingCta } from "@/components/landing/ClosingCta.jsx";
import { ExplainBackPreview } from "@/components/landing/ExplainBackPreview.jsx";
import { FaqSection } from "@/components/landing/FaqSection.jsx";
import { FeatureGrid } from "@/components/landing/FeatureGrid.jsx";
import { HowItWorks } from "@/components/landing/HowItWorks.jsx";
import { LandingFacts } from "@/components/landing/LandingFacts.jsx";
import { LandingFooter } from "@/components/landing/LandingFooter.jsx";
import { LandingHero } from "@/components/landing/LandingHero.jsx";
import { LandingNav } from "@/components/landing/LandingNav.jsx";
import { ReviewsSection } from "@/components/landing/ReviewsSection.jsx";
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
  const consentedReviews = content.reviews.filter((review) => review.consentGiven);
  const showReviews = consentedReviews.length >= 3;
  const links = content.nav.filter((link) => showReviews || link.href !== "#reviews");

  return (
    <>
      <LandingNav
        wordmark={content.wordmark}
        links={links}
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
        {showReviews ? <ReviewsSection title={content.reviewsTitle} reviews={consentedReviews} /> : null}
        <AboutSection
          title={content.aboutTitle}
          body={content.aboutBody}
          stack={content.aboutStack}
          githubLabel={content.aboutGithubLabel}
          githubUrl={content.aboutGithubUrl}
          visuals={content.skillCards}
        />
        <FaqSection title={content.faqTitle} items={content.faq} />
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
        links={links}
        primaryCta={content.primaryCta}
        secondaryCta={content.secondaryCta}
        skills={content.aboutSkills.map((skill) => skill.title)}
      />
    </>
  );
}
