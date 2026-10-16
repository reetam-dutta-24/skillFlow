import Link from "next/link";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";
import { ReplayTourButton } from "@/components/tour/HomeTour";

type NextLesson = { title: string; skillName: string; href: string; image: string | null } | null;

/** One clear opening for Home: who you are, your streak, and the single next thing to do. Personal, read on the request. */
export function HomeHero({
  firstName,
  streak,
  nextLesson,
  followedCount,
  fallbackHref,
  returning,
}: {
  firstName: string | null;
  streak: number;
  nextLesson: NextLesson;
  followedCount: number;
  fallbackHref: string;
  /** Has started learning before. A brand-new learner is welcomed, not welcomed back. */
  returning: boolean;
}) {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const hello = returning ? "Welcome back" : "Welcome";
  const greeting = firstName ? `${hello}, ${firstName}` : hello;
  const sub =
    streak > 0
      ? `You're on a ${streak}-day streak. One explained idea today keeps it going.`
      : nextLesson
        ? "Pick up where you left off. One idea at a time is enough."
        : followedCount === 0
          ? "Let's find your first path. Thirty are free, every stage included."
          : "Your paths are ready when you are.";

  return (
    <section className="sf-home-hero" aria-labelledby="home-title">
      <div className="sf-home-hero-top">
        <div className="sf-home-hero-copy">
          <p className="sf-home-date">{today}</p>
          <h1 id="home-title">{greeting}</h1>
          <p className="sf-home-sub">{sub}</p>
        </div>
        <div className="sf-home-hero-meta">
          <p className="sf-home-streak" data-on={streak > 0 ? "true" : undefined}>
            <Icon name="flame" size={16} />
            {streak > 0 ? `${streak}-day streak` : "No streak yet"}
          </p>
          <ReplayTourButton />
        </div>
      </div>

      <div className="sf-home-next">
        <span className="sf-home-next-art" aria-hidden="true">
          {nextLesson?.image ? (
            <SkillImage src={nextLesson.image} alt="" fill sizes="(max-width: 640px) 100vw, 220px" />
          ) : (
            <span className="sf-home-next-glyph">
              <Icon name={nextLesson ? "play" : "compass"} size={26} />
            </span>
          )}
        </span>
        <div className="sf-home-next-copy">
          <p className="sf-home-next-kicker">{nextLesson ? `Up next · ${nextLesson.skillName}` : followedCount === 0 ? "Your first step" : "Your paths"}</p>
          <h2>{nextLesson ? nextLesson.title : followedCount === 0 ? "Pick your first path" : "Open a path to continue"}</h2>
          <p>
            {nextLesson
              ? "Take the resources at your own pace, then explain the stage back."
              : followedCount === 0
                ? "Follow a niche you care about. Its first stage opens right away."
                : "Choose a stage on one of your paths and keep going."}
          </p>
        </div>
        <Link className="sf-btn sf-btn--gradient sf-btn--lg sf-home-next-cta" href={nextLesson?.href ?? fallbackHref}>
          {nextLesson ? "Continue" : followedCount === 0 ? "Browse niches" : "Open my paths"}
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </section>
  );
}
