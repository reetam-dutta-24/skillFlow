import Link from "next/link";
import type { BuiltPlan, BuiltStage, StageLabel } from "@/lib/plan/build";
import { undoPlan, usePlan } from "../preferences/actions";

const LABEL: Record<StageLabel, string> = {
  study: "Study",
  test_out: "Test out",
  review: "Review",
  passed: "Passed",
  locked: "Locked",
};

function hours(minutes: number) {
  const value = Math.round((minutes / 60) * 10) / 10;
  return `${value} h`;
}

function sharedLanguageNote(plan: BuiltPlan) {
  const notes = [...new Set(plan.stages.map((stage) => stage.languageNote).filter((note): note is string => Boolean(note)))];
  if (notes.length !== 1) return null;
  const match = /^No (.+) resource yet for this stage$/.exec(notes[0]);
  if (!match) return notes[0];
  return `This path has no ${match[1]} resources yet, so the schedule uses English.`;
}

function stageMinutes(stage: BuiltStage) {
  const assumed = stage.resources.some((resource) => resource.assumed && !resource.optional);
  const label = stage.minutes === 1 ? "1 min" : `${stage.minutes} min`;
  return assumed ? `About ${label}` : label;
}

function StageRow({ stage, repeatNote, closed }: { stage: BuiltStage; repeatNote: boolean; closed: boolean }) {
  const extra = stage.resources.filter((resource) => resource.optional).length;
  const locked = closed || stage.label === "locked";
  const mark = locked ? "locked" : stage.label;
  const body = (
    <>
      <span className={`sf-plan-mark sf-plan-mark-${mark}`}>{locked ? "Locked" : LABEL[stage.label]}</span>
      <span className="sf-plan-copy">
        <strong>{stage.title}</strong>
        <span>
          {locked
            ? "Opens after the previous stage"
            : stage.label === "passed"
              ? "Passed"
              : stageMinutes(stage)}
          {!locked && extra > 0 ? ` · ${extra} extra` : ""}
          {!locked && repeatNote && stage.languageNote ? ` · ${stage.languageNote}` : ""}
        </span>
      </span>
    </>
  );
  if (locked) return <div className="sf-plan-row is-locked">{body}</div>;
  return (
    <Link className="sf-plan-row" href={`/lesson/${stage.id}`}>
      {body}
    </Link>
  );
}

export function PlanBoard({
  slug,
  skillId,
  plan,
  applied,
  closedIds,
}: {
  slug: string;
  skillId: string;
  plan: BuiltPlan;
  applied: boolean;
  closedIds: ReadonlySet<string>;
}) {
  if (!applied) {
    return (
      <section className="sf-plan-board" aria-label="Original roadmap">
        <header className="sf-plan-head">
          <div>
            <p className="sf-path-kicker">Saved plan</p>
            <h2>Original stages</h2>
            <p>Your preferences are still saved. These are the shared stages, in catalog order.</p>
          </div>
          <div className="sf-notes-actions">
            <form action={usePlan}>
              <input type="hidden" name="skillId" value={skillId} />
              <button className="sf-path-cta" type="submit">
                Use my plan
              </button>
            </form>
            <Link href={`/roadmap/${slug}/preferences`}>Edit preferences</Link>
          </div>
        </header>
      </section>
    );
  }

  const languageNote = sharedLanguageNote(plan);
  const repeatNote = languageNote == null;

  return (
    <section className="sf-plan-board" aria-label="Your plan">
      <header className="sf-plan-head">
        <div>
          <p className="sf-path-kicker">Your plan</p>
          <h2>{hours(plan.totalMinutes)} across this path</h2>
          <ul className="sf-plan-stats">
            {plan.weeklyMinutes ? <li>{plan.weeklyMinutes} min a week</li> : null}
            {plan.assumed ? <li>Some lengths are estimates</li> : null}
            <li>{plan.schedule.length === 1 ? "1 week" : `${plan.schedule.length} weeks`}</li>
          </ul>
          {languageNote ? <p className="sf-plan-note">{languageNote}</p> : null}
          {plan.warning ? <p className="sf-plan-note">{plan.warning}</p> : null}
        </div>
        <div className="sf-notes-actions">
          <Link href={`/roadmap/${slug}/preferences`}>Edit preferences</Link>
          <form action={undoPlan}>
            <input type="hidden" name="skillId" value={skillId} />
            <button type="submit">Show original stages</button>
          </form>
        </div>
      </header>
      {plan.schedule.length ? (
        <ol className="sf-plan-weeks">
          {plan.schedule.map((week) => {
            const stages = week.stageIds
              .map((id) => plan.stages.find((item) => item.id === id))
              .filter((stage): stage is BuiltStage => Boolean(stage));
            if (stages.length === 0) return null;
            const openMinutes = stages
              .filter((stage) => !closedIds.has(stage.id) && stage.label !== "locked")
              .reduce((sum, stage) => sum + stage.minutes, 0);
            return (
              <li key={week.week}>
                <header>
                  <strong>Week {week.week}</strong>
                  <span>{openMinutes === 1 ? "1 min open" : `${openMinutes} min open`}</span>
                </header>
                <ol>
                  {stages.map((stage) => (
                    <li key={stage.id}>
                      <StageRow stage={stage} repeatNote={repeatNote} closed={closedIds.has(stage.id)} />
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="sf-plan-note">Every open stage on this plan is already passed.</p>
      )}
    </section>
  );
}
