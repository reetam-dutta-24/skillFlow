import Link from "next/link";
import { HomeTileArt } from "./HomeTileArt";
import { AREAS } from "@/lib/career/meta";
import { loadCareerState } from "@/lib/data/career";
import { prisma } from "@/lib/prisma";

const CAREER_ART = "/skills/job-search.jpg";

/** Home's career-fit tile. Personal, so it is read on the request with the rest of Home. */
export async function CareerTestCard({ userId }: { userId: string }) {
  const state = await loadCareerState(userId);

  if (state.status === "complete") {
    const top = state.report.paths[0]?.slug;
    const skill = top ? await prisma.skill.findUnique({ where: { slug: top }, select: { name: true } }) : null;
    return (
      <section className="sf-home-tile is-career" aria-labelledby="ctcard-title">
        <HomeTileArt src={CAREER_ART} icon="compass" badge="Report ready" />
        <p className="sf-home-tile-kicker">Your career-fit</p>
        <h2 id="ctcard-title">{state.scores.code.map((area) => AREAS[area].name).join(" · ")}</h2>
        <p className="sf-home-tile-text">{skill ? `Your strongest match is ${skill.name}.` : "Your report is ready."}</p>
        <div className="sf-home-tile-actions">
          <Link className="sf-btn sf-btn--outline sf-btn--md" href="/career-test/report">
            View my report
          </Link>
        </div>
      </section>
    );
  }

  const inProgress = state.status === "in-progress";
  return (
    <section className="sf-home-tile is-career" aria-labelledby="ctcard-title">
      <HomeTileArt src={CAREER_ART} icon="compass" />
      <p className="sf-home-tile-kicker">Career-fit test · about 25 min</p>
      <h2 id="ctcard-title">{inProgress ? "Pick up your career-fit test" : "Not sure which path fits you?"}</h2>
      <p className="sf-home-tile-text">
        {inProgress
          ? `${state.answered} of ${state.total} answered. Finish it for your interests, strengths, and best-fit paths.`
          : "Two published questionnaires, then a report on your strengths and the paths that suit you."}
      </p>
      <div className="sf-home-tile-actions">
        <Link className="sf-btn sf-btn--outline sf-btn--md" href="/career-test">
          {inProgress ? "Continue the test" : "Take the test"}
        </Link>
      </div>
    </section>
  );
}
