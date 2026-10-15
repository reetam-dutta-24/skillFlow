import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Icon } from "@/components/core/Icon.jsx";
import { StatCard } from "@/components/core/StatCard.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { DetoxIllustration } from "@/components/detox/DetoxIllustration";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { loadDetoxOverview } from "@/lib/data/detox";
import { playbookStep } from "@/lib/detox/playbook";
import { screenBand, DETOX_QUESTION_COUNT } from "@/lib/detox/questions";
import { rulesGuidance } from "@/lib/detox/rules-guidance";
import { NOT_MEDICAL } from "@/lib/detox/state";
import { prisma } from "@/lib/prisma";
import { DetoxBoard } from "./_components/DetoxBoard";
import { CheckInCard } from "./_components/CheckInCard";
import { DetoxHero } from "./_components/DetoxHero";
import { DetoxReportActions } from "./_components/DetoxReportActions";
import { DetoxSupport } from "./_components/DetoxSupport";
import { FocusCard } from "./_components/FocusCard";

export const metadata: Metadata = { title: "Dopamine Detox" };

export default function DetoxPage({ searchParams }: { searchParams: Promise<{ swap?: string }> }) {
  return (
    <Suspense fallback={<DetoxSkeleton />}>
      <DetoxContent searchParams={searchParams} />
    </Suspense>
  );
}

function DetoxSkeleton() {
  return (
    <div className="sf-dtx" aria-busy="true">
      <Skeleton width="40%" height={32} radius="10px" />
      <Skeleton width="100%" height={320} radius="var(--radius-card)" />
      <Skeleton width="100%" height={180} radius="var(--radius-card)" />
    </div>
  );
}

const PART_ICON: [RegExp, string][] = [
  [/idea/, "message-square-quote"],
  [/stage/, "flag"],
  [/recall/, "brain"],
  [/focused/, "timer"],
  [/practice/, "pencil"],
  [/contribution/, "git-pull-request"],
  [/screen time/, "smartphone"],
  [/daily limit/, "gauge"],
];

function partIcon(part: string) {
  return PART_ICON.find(([pattern]) => pattern.test(part))?.[1] ?? "sparkles";
}

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Personal and sensitive: everything here is read on the request. Nothing is cached. */
async function DetoxContent({ searchParams }: { searchParams: Promise<{ swap?: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const [{ swap }, overview] = await Promise.all([searchParams, loadDetoxOverview(userId)]);

  if (!overview.ready) {
    const state = overview.state;
    return (
      <div className="sf-dtx">
        <section className="sf-dtx-welcome" aria-labelledby="dtx-welcome-title">
          <div className="sf-dtx-welcome-copy">
            <p className="sf-dtx-kicker">
              <Icon name="leaf" size={14} /> Dopamine Detox
            </p>
            <h1 id="dtx-welcome-title">Your dopamine detox, with proof</h1>
            <p className="sf-dtx-lede">
              Most detox apps count the hours you stayed away. SkillFlow counts what you did instead: ideas you explained, recalls you
              answered, and focused minutes. Start with a three-minute self-check.
            </p>
            <ol className="sf-dtx-how">
              <li>
                <span>1</span>
                <div>
                  <strong>Take the self-check</strong>
                  <p>{DETOX_QUESTION_COUNT} short questions give your starting Detox Score.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Learn for real</strong>
                  <p>Only verified learning moves the score, with a daily limit, so hours alone never inflate it.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>See the proof</strong>
                  <p>A one-minute weekly check-in, charts, and a before-and-after card you can share.</p>
                </div>
              </li>
            </ol>
            <div className="sf-dtx-welcome-actions">
              <Link className="sf-btn sf-btn--gradient sf-btn--xl" href="/detox/check">
                {state.status === "in-progress" ? `Continue the self-check (${state.answered} of ${state.total})` : "Take the self-check"}
              </Link>
            </div>
            <p className="sf-dtx-note">{NOT_MEDICAL}</p>
          </div>
          <div className="sf-dtx-welcome-art">
            <DetoxIllustration />
          </div>
        </section>
      </div>
    );
  }

  const ready = overview.ready;
  const [dashboard, todayFocus] = await Promise.all([
    getDashboardData(),
    prisma.focusSession.aggregate({ where: { userId, endedAt: { gte: startOfToday() } }, _sum: { focusedMinutes: true } }),
  ]);
  const continueHref =
    dashboard.nextLesson?.href ??
    dashboard.followed.flatMap((row) => row.lane).find((item) => item.status === "current" || item.status === "ready")?.href ??
    null;
  const guidance =
    ready.guidance ??
    (ready.distress
      ? null
      : rulesGuidance({ answers: overview.state.status === "complete" ? overview.state.answers : {}, baseline: ready.baseline, score: ready.score, sections: ready.sections, week: ready.breakdown.counts }));
  const steps = (guidance?.steps ?? []).map((id) => playbookStep(id)).filter((step) => step !== null);
  const { kpis } = ready;
  const screenValue = kpis.screenTo
    ? `${screenBand(kpis.screenFrom).hours}h → ${screenBand(kpis.screenTo).hours}h`
    : `${screenBand(kpis.screenFrom).hours}h`;

  return (
    <div className="sf-dtx">
      <header className="sf-page-head sf-dtx-head">
        <p className="sf-dtx-kicker">
          <Icon name="leaf" size={14} /> Dopamine Detox
        </p>
        <h1>Your dopamine detox, with proof</h1>
        <p>Your score starts from your self-check and moves only with real learning. {NOT_MEDICAL}</p>
      </header>

      <DetoxHero
        score={ready.score}
        from={ready.breakdown.previous}
        change={ready.breakdown.change}
        bandId={ready.band.id}
        bandLabel={ready.band.label}
        blurb={ready.band.blurb}
        openSwap={swap === "1"}
      />

      <section className="sf-dtx-card sf-dtx-why" aria-labelledby="dtx-why-title">
        <header>
          <p className="sf-dtx-kicker">
            <Icon name="list-checks" size={14} /> Why it moved
          </p>
          <h2 id="dtx-why-title">{ready.breakdown.summary}</h2>
        </header>
        {ready.breakdown.parts.length ? (
          <ul className="sf-dtx-parts" aria-label="This week's proof">
            {ready.breakdown.parts.map((part) => (
              <li key={part}>
                <Icon name={partIcon(part)} size={15} />
                {part}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="sf-dtx-quiet">
          Started at {ready.baseline} on {ready.completedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}. Each day can
          add at most 5 points, so steady days count for more than long ones.
        </p>
      </section>

      {ready.distress ? (
        <DetoxSupport />
      ) : (
        <section className="sf-dtx-steps" aria-labelledby="dtx-steps-title">
          <header className="sf-dtx-section-head">
            <p className="sf-dtx-kicker">
              <Icon name="footprints" size={14} /> Next 3 steps
            </p>
            <h2 id="dtx-steps-title">🌿 What to try this week</h2>
            {guidance ? <p className="sf-dtx-narrative">{guidance.narrative}</p> : null}
          </header>
          <ol className="sf-dtx-step-list">
            {steps.map((step, position) => (
              <li key={step.id} className="sf-dtx-step">
                <span className="sf-dtx-step-n" aria-hidden="true">
                  {position + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                  {step.action ? (
                    <Link className="sf-dtx-step-link sf-hit" href={step.action.href === "/dashboard" && continueHref ? continueHref : step.action.href}>
                      {step.action.label}
                      <Icon name="arrow-right" size={14} />
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
          <p className="sf-dtx-quiet">These steps come from SkillFlow&apos;s fixed playbook. {guidance?.source === "model" ? "An AI picked them from your scores; it never sets the number." : ""}</p>
        </section>
      )}

      <ul className="sf-analytics-kpis sf-dtx-kpis" aria-label="Since your self-check">
        <li>
          <StatCard label="Days active" value={kpis.daysActive} icon={<Icon name="calendar-check" size={14} />} />
        </li>
        <li>
          <StatCard label="Ideas passed" value={kpis.ideasPassed} icon={<Icon name="message-square-quote" size={14} />} />
        </li>
        <li>
          <StatCard label="Focused minutes" value={kpis.focusedMinutes} icon={<Icon name="timer" size={14} />} />
        </li>
        <li>
          <StatCard
            label="Average recall"
            value={kpis.averageRecall ?? "—"}
            unit={kpis.averageRecall === null ? undefined : "of 100"}
            hint={kpis.averageRecall === null ? "Shows after your first recall" : undefined}
            icon={<Icon name="brain" size={14} />}
          />
        </li>
        <li>
          <StatCard
            label="Screen time a day"
            value={screenValue}
            hint={kpis.screenTo ? "Self-check → latest check-in" : "From your self-check"}
            icon={<Icon name="smartphone" size={14} />}
          />
        </li>
      </ul>

      <div className="sf-dtx-pair">
        <CheckInCard current={ready.checkIn ? { screenBand: ready.checkIn.screenBand, focus: ready.checkIn.focus } : null} due={ready.checkInDue} />
        <FocusCard continueHref={continueHref} todayMinutes={todayFocus._sum.focusedMinutes ?? 0} />
      </div>

      <DetoxBoard weeks={ready.weeks} baseline={ready.baseline} score={ready.score} mix={ready.mix} />

      <section className="sf-dtx-card sf-dtx-report" aria-labelledby="dtx-report-title">
        <div className="sf-dtx-report-copy">
          <p className="sf-dtx-kicker">
            <Icon name="image" size={14} /> Before and after
          </p>
          <h2 id="dtx-report-title">🪪 Your report card</h2>
          <p>Your starting score, your score now, and the proof in between, as one image. It stays private until you share it yourself.</p>
          <DetoxReportActions />
        </div>
        <div className="sf-dtx-report-preview" aria-hidden="true">
          <span>Before</span>
          <strong>{ready.baseline > 0 ? `+${ready.baseline}` : ready.baseline}</strong>
          <Icon name="arrow-right" size={20} />
          <span>Now</span>
          <strong data-now="true">{ready.score > 0 ? `+${ready.score}` : ready.score}</strong>
        </div>
      </section>

      <p className="sf-dtx-footnote">
        <Icon name="info" size={14} /> {NOT_MEDICAL} The self-check uses SkillFlow&apos;s own questions; it is not a clinical questionnaire.
      </p>
    </div>
  );
}
