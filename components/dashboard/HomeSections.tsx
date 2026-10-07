import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/core/Icon.jsx";
import { StatCard } from "@/components/core/StatCard.jsx";
import { ContributionHeatmap } from "@/components/community/ContributionHeatmap";
import type { Activity } from "@/lib/activity";
import type { HomeExtras } from "@/lib/data/home";
import type { DashboardData } from "@/lib/types/pages";

/** The figures from Progress, Notes, and recall, in one row, plus this week's activity. Personal, read on the request. */
export function HomeKpis({ data, extras }: { data: DashboardData; extras: HomeExtras }) {
  const totalStages = data.followed.reduce((sum, row) => sum + row.total, 0);
  const passedStages = data.followed.reduce((sum, row) => sum + row.passed, 0);
  const averageMastery = data.followed.length
    ? Math.round(data.followed.reduce((sum, row) => sum + row.skill.masteryPercent, 0) / data.followed.length)
    : 0;
  const weekTotal = data.week.reduce((sum, day) => sum + day.checks, 0);
  const peak = Math.max(1, ...data.week.map((day) => day.checks));

  return (
    <section className="sf-home-kpis" aria-labelledby="home-kpis">
      <h2 id="home-kpis">At a glance</h2>
      <div className="sf-home-kpi-layout">
        <ul className="sf-home-kpi-grid">
          <li>
            <StatCard label="Current streak" value={data.currentStreak} unit={data.currentStreak === 1 ? "day" : "days"} icon={<Icon name="flame" size={14} />} />
          </li>
          <li>
            <StatCard
              label="Stages passed"
              value={passedStages}
              unit={totalStages ? `of ${totalStages}` : undefined}
              icon={<Icon name="flag" size={14} />}
            />
          </li>
          <li>
            <StatCard label="Passed this week" value={data.milestonesPassedThisWeek} icon={<Icon name="calendar-check" size={14} />} />
          </li>
          <li>
            <StatCard label="Average mastery" value={averageMastery} unit="%" icon={<Icon name="chart-line" size={14} />} />
          </li>
          <li>
            <StatCard label="Notes saved" value={extras.notesCount} icon={<Icon name="notebook-pen" size={14} />} />
          </li>
          <li>
            <StatCard
              label="Retention"
              value={extras.retention ?? "—"}
              unit={extras.retention == null ? undefined : "of 100"}
              hint={extras.retention == null ? "Shows after your first recall" : undefined}
              icon={<Icon name="brain" size={14} />}
            />
          </li>
        </ul>
        <figure className="sf-home-week" aria-labelledby="home-week-title">
          <figcaption id="home-week-title">
            <strong>This week</strong>
            <span>
              {weekTotal} explain-back {weekTotal === 1 ? "check" : "checks"}
            </span>
          </figcaption>
          <ol className="sf-home-week-bars">
            {data.week.map((day) => (
              <li key={day.day} title={`${day.day}: ${day.checks} ${day.checks === 1 ? "check" : "checks"}`}>
                <span className="sf-home-week-track">
                  <span style={{ height: `${day.checks ? Math.max((day.checks / peak) * 100, 8) : 0}%` }} />
                </span>
                <span className="sf-home-week-day">{day.day}</span>
                <span className="sf-sr">
                  {day.checks} {day.checks === 1 ? "check" : "checks"}
                </span>
              </li>
            ))}
          </ol>
        </figure>
      </div>
    </section>
  );
}

/** Every contribution per day for the last year, the same heatmap the profile shows. Personal, read on the request. */
export function HomeActivity({ activity, userId }: { activity: Activity; userId: string }) {
  return (
    <section className="sf-home-activity" aria-labelledby="home-activity">
      <header>
        <h2 id="home-activity">Your activity</h2>
        <Link className="sf-home-panel-link" href={`/profile/${userId}`}>
          Profile
        </Link>
      </header>
      <div className="sf-home-activity-card">
        <ContributionHeatmap heatmap={activity.heatmap} headingId="home-heatmap-total" noun="contribution" />
        {activity.byKind.length ? (
          <ul className="sf-prof-kinds" aria-label="What counted">
            {activity.byKind.map((kind) => (
              <li key={kind.id}>
                <strong>{kind.count}</strong> {kind.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="sf-home-quiet-line">
            Every stage passed, idea explained, recall answered, note, and Open Source contribution adds a square here.
          </p>
        )}
      </div>
    </section>
  );
}

function Panel({ id, icon, title, href, linkLabel, children }: { id: string; icon: string; title: string; href: string; linkLabel: string; children: ReactNode }) {
  return (
    <section className="sf-home-panel" aria-labelledby={id}>
      <header>
        <span className="sf-home-panel-icon" aria-hidden="true">
          <Icon name={icon} size={16} />
        </span>
        <h3 id={id}>{title}</h3>
        <Link className="sf-home-panel-link" href={href}>
          {linkLabel}
        </Link>
      </header>
      {children}
    </section>
  );
}

function Quiet({ children, action }: { children: ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="sf-home-quiet">
      <p>{children}</p>
      {action ? (
        <Link className="sf-btn sf-btn--outline sf-btn--sm" href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

/** One place for what the other sidebar sections hold: mastery, reviews, notes, events, Open Source, and records. */
export function HomePanels({ data, extras, userId }: { data: DashboardData; extras: HomeExtras; userId: string }) {
  const records = data.followed.filter((row) => row.passed > 0);
  return (
    <section className="sf-home-for" aria-labelledby="home-for">
      <h2 id="home-for">For you</h2>
      <div className="sf-home-panels">
        <Panel id="home-mastery" icon="chart-line" title="Mastery by path" href="/progress" linkLabel="Progress">
          {data.followed.length ? (
            <ul className="sf-home-mastery">
              {data.followed.map((row) => (
                <li key={row.skill.id}>
                  <div className="sf-home-mastery-top">
                    <Link href={row.roadmapHref}>{row.skill.name}</Link>
                    <span>
                      {row.passed}/{row.total} · {row.skill.masteryPercent}%
                    </span>
                  </div>
                  <span
                    className="sf-home-mastery-track"
                    role="meter"
                    aria-label={`${row.skill.name} mastery`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={row.skill.masteryPercent}
                    title={`${row.skill.name}: ${row.skill.masteryPercent}% mastery, ${row.passed} of ${row.total} stages passed`}
                  >
                    <span style={{ width: `${Math.max(row.skill.masteryPercent, 2)}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Quiet action={{ href: "/skills", label: "Browse niches" }}>Follow a path and its mastery shows here.</Quiet>
          )}
        </Panel>

        <Panel id="home-review" icon="rotate-ccw" title="Needs another look" href="/progress" linkLabel="All">
          {data.weakTopics.length ? (
            <ul className="sf-home-list">
              {data.weakTopics.map((topic) => (
                <li key={topic.id}>
                  <Link href={topic.href}>{topic.topic}</Link>
                  <span>
                    {topic.skillName} · {topic.reason}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Quiet>Nothing waiting. A stage you tried but did not pass yet shows up here.</Quiet>
          )}
        </Panel>

        <Panel id="home-notes" icon="notebook-pen" title="Recent notes" href="/notes" linkLabel="Notes">
          {extras.recentNotes.length ? (
            <ul className="sf-home-list">
              {extras.recentNotes.map((note) => (
                <li key={note.id}>
                  <Link href="/notes">{note.concept}</Link>
                  <span>
                    {note.skillName} · {note.stageTitle} · {note.when}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Quiet action={data.nextLesson ? { href: data.nextLesson.href, label: "Open your next stage" } : undefined}>
              Every idea you explain well is kept here with its review.
            </Quiet>
          )}
        </Panel>

        <Panel id="home-events" icon="map-pin" title={extras.city ? `Coming up near ${extras.city.split(",")[0]}` : "Events near you"} href="/nearby/events" linkLabel="Nearby">
          {extras.events.length ? (
            <ul className="sf-home-list">
              {extras.events.map((event) => (
                <li key={event.id}>
                  <a href={event.url} target="_blank" rel="noreferrer">
                    {event.title}
                  </a>
                  <span>
                    {event.when}
                    {event.where ? ` · ${event.where}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : extras.city ? (
            <Quiet action={{ href: "/nearby/events", label: "See Nearby" }}>No saved events for your paths in the next month yet.</Quiet>
          ) : (
            <Quiet action={{ href: "/settings", label: "Add your city" }}>Save a city in Settings and events for your paths show up here.</Quiet>
          )}
        </Panel>

        <Panel id="home-os" icon="git-pull-request" title="Open Source in your niches" href="/open-source" linkLabel="Open Source">
          {extras.contributions.length ? (
            <>
              {extras.communityNew > 0 ? (
                <p className="sf-home-badge">
                  {extras.communityNew} new since your last visit
                </p>
              ) : null}
              <ul className="sf-home-list">
                {extras.contributions.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href}>{item.title}</Link>
                    <span>{item.niche}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Quiet action={{ href: "/open-source", label: "Open Source" }}>No published contributions in your niches yet. Be the first.</Quiet>
          )}
        </Panel>

        <Panel id="home-records" icon="award" title="Your records" href="/progress" linkLabel="Progress">
          {records.length ? (
            <ul className="sf-home-list">
              {records.map((row) => {
                const complete = row.total > 0 && row.passed === row.total;
                return (
                  <li key={row.skill.id}>
                    <Link href={`/${complete ? "certificate" : "transcript"}/${userId}/${row.skill.slug}`}>
                      {complete ? `${row.skill.name} certificate` : `${row.skill.name} transcript`}
                    </Link>
                    <span>
                      {row.passed} of {row.total} stages passed{complete ? " · complete" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Quiet>Pass your first explain-back and your transcript starts here. Finish a path for its certificate.</Quiet>
          )}
        </Panel>
      </div>
    </section>
  );
}
