import Link from "next/link";
import { Icon } from "@/components/core/Icon.jsx";
import { AREAS } from "@/lib/career/meta";
import { loadCareerState } from "@/lib/data/career";
import { prisma } from "@/lib/prisma";

/** Home's career-fit card. Personal, so it is read on the request with the rest of Home. */
export async function CareerTestCard({ userId }: { userId: string }) {
  const state = await loadCareerState(userId);

  if (state.status === "complete") {
    const top = state.report.paths[0]?.slug;
    const skill = top ? await prisma.skill.findUnique({ where: { slug: top }, select: { name: true } }) : null;
    return (
      <section className="sf-ctcard is-done" aria-labelledby="ctcard-title">
        <span className="sf-ctcard-icon" aria-hidden="true">
          <Icon name="compass" size={22} />
        </span>
        <div className="sf-ctcard-body">
          <p className="sf-ctcard-kicker">Your career-fit</p>
          <h2 id="ctcard-title">
            {state.scores.code.map((area) => AREAS[area].name).join(" · ")}
          </h2>
          <p>{skill ? `Your strongest match is ${skill.name}. The report explains why, and how to approach your top five paths.` : "Your report is ready."}</p>
        </div>
        <Link className="sf-btn sf-btn--outline sf-btn--md" href="/career-test/report">
          View my report
        </Link>
      </section>
    );
  }

  const inProgress = state.status === "in-progress";
  return (
    <section className="sf-ctcard" aria-labelledby="ctcard-title">
      <span className="sf-ctcard-icon" aria-hidden="true">
        <Icon name="compass" size={22} />
      </span>
      <div className="sf-ctcard-body">
        <p className="sf-ctcard-kicker">Career-fit test</p>
        <h2 id="ctcard-title">{inProgress ? "Pick up where you left off" : "Not sure which path fits you?"}</h2>
        <p>
          {inProgress
            ? `${state.answered} of ${state.total} answered. Finish the test for a detailed report on your interests, your strengths, and the paths that fit you.`
            : "Take the career-fit test: two published questionnaires on personality and interests, then a detailed report on your potential strengths and the paths that suit you, with how to approach each one. About 25 minutes, saved as you go."}
        </p>
      </div>
      <Link className="sf-btn sf-btn--gradient sf-btn--md" href="/career-test">
        {inProgress ? "Continue the test" : "Take the test"}
      </Link>
    </section>
  );
}
