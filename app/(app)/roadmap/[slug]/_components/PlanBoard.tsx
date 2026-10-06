import Link from "next/link";
import type { BuiltPlan } from "@/lib/plan/build";

const LABEL = {
  study: "Study",
  test_out: "Test out",
  review: "Recommended to review",
  passed: "Passed",
  locked: "Locked",
} as const;

function hours(minutes: number) {
  const value = Math.round((minutes / 60) * 10) / 10;
  return `${value} h`;
}

export function PlanBoard({ slug, plan }: { slug: string; plan: BuiltPlan }) {
  return (
    <section className="sf-plan-board" aria-label="Your plan">
      <header>
        <h2>Your plan</h2>
        <p>
          About {hours(plan.totalMinutes)}
          {plan.assumed ? " (some lengths are estimates)" : ""}
          {plan.weeklyMinutes ? ` · ${plan.weeklyMinutes} min a week` : ""}
        </p>
        <p className="sf-notes-actions">
          <Link href={`/roadmap/${slug}/preferences`}>Edit preferences</Link>
        </p>
      </header>
      {plan.warning ? <p className="sf-note-summary">{plan.warning}</p> : null}
      {plan.schedule.length ? (
        <ol className="sf-plan-weeks">
          {plan.schedule.map((week) => (
            <li key={week.week}>
              <strong>Week {week.week}</strong>
              <ul>
                {week.stageIds.map((id) => {
                  const stage = plan.stages.find((item) => item.id === id);
                  if (!stage) return null;
                  const optional = stage.resources.filter((resource) => resource.optional).length;
                  return (
                    <li key={id}>
                      {stage.title}
                      <span> · {LABEL[stage.label]}</span>
                      {optional ? <span> · {optional} optional</span> : null}
                      {stage.languageNote ? <span> · {stage.languageNote}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
