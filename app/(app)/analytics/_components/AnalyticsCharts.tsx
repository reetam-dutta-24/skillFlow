"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "framer-motion";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import type { AnalyticsData } from "@/lib/data/analytics";

/**
 * Categorical slots, in fixed order, from the validated reference palette (see app/globals.css --viz-*).
 * A chart never cycles them: four groups at most, and the mastery lines cap at four paths.
 */
const SERIES = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)"];
const AXIS = { stroke: "var(--chart-axis)", tick: { fill: "var(--chart-axis)", fontSize: 12 } };
const GAP = "var(--surface-card)";

type TipRow = { name?: string; value?: number | string; color?: string; payload?: { fill?: string } };

function ChartTip({ active, payload, label, unit }: { active?: boolean; payload?: TipRow[]; label?: string | number; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="sf-chart-tip">
      {label !== undefined && label !== "" ? <p className="sf-chart-tip-label">{label}</p> : null}
      {payload.map((item) => (
        <p key={`${item.name}-${item.value}`}>
          <span style={{ background: item.color ?? item.payload?.fill }} />
          {item.name}: {item.value}
          {unit ?? ""}
        </p>
      ))}
    </div>
  );
}

/** The legend doubles as the table view: every slice with its number, so color is never the only cue. */
function Legend({ rows }: { rows: { name: string; count: number | string; color: string }[] }) {
  return (
    <ul className="sf-viz-legend">
      {rows.map((row) => (
        <li key={row.name}>
          <span className="sf-viz-swatch" style={{ background: row.color }} aria-hidden="true" />
          <span>{row.name}</span>
          <strong>{row.count}</strong>
        </li>
      ))}
    </ul>
  );
}

function Donut({ rows, total, caption, animate }: { rows: { name: string; count: number; color: string }[]; total: number; caption: string; animate: boolean }) {
  const shown = rows.filter((row) => row.count > 0);
  return (
    <div className="sf-viz-donut">
      <div className="sf-chart-frame sf-chart-pie">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie isAnimationActive={animate} data={shown} dataKey="count" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={2} stroke={GAP} strokeWidth={2}>
              {shown.map((row) => (
                <Cell key={row.name} fill={row.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTip />} />
          </PieChart>
        </ResponsiveContainer>
        <p className="sf-pie-center">
          <strong>{total}</strong>
          <span>{caption}</span>
        </p>
      </div>
      <Legend rows={rows} />
    </div>
  );
}

function Card({ id, title, note, wide = false, children }: { id: string; title: string; note: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <section className={wide ? "sf-chart-card sf-chart-wide" : "sf-chart-card"} aria-labelledby={id}>
      <header>
        <h2 id={id}>{title}</h2>
        <p>{note}</p>
      </header>
      {children}
    </section>
  );
}

export function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  // Recharts animates on its own clock, so reduced motion has to switch it off here, not in CSS.
  const animate = !useReducedMotion();
  const groupColor = new Map(data.groups.map((group, index) => [group.id, SERIES[index]]));
  const activityTotal = data.groups.reduce((sum, group) => sum + group.count, 0);
  const ideaTotal = data.outcomes.reduce((sum, row) => sum + row.count, 0);
  const busiestMonth = [...data.months].sort((a, b) => b.total - a.total)[0];
  const linePaths = [...data.series]
    .map((item) => ({ ...item, latest: data.history.at(-1)?.values[item.key] ?? 0 }))
    .sort((a, b) => b.latest - a.latest)
    .slice(0, 4);
  const history = data.history.map((row) => ({ month: row.month, ...row.values }));
  const weekdayPeak = Math.max(0, ...data.weekdays.map((day) => day.count));
  const recallAverage = data.recall.length ? Math.round(data.recall.reduce((sum, row) => sum + row.score, 0) / data.recall.length) : null;

  return (
    <div className="sf-analytics-grid">
      <Card
        id="chart-months"
        wide
        title="Your activity, month by month"
        note={
          activityTotal
            ? `${activityTotal} contributions in the last 12 months. ${busiestMonth && busiestMonth.total ? `${busiestMonth.month} was the busiest, with ${busiestMonth.total}.` : ""}`
            : "Each bar fills as you pass stages, explain ideas, answer recalls, and contribute."
        }
      >
        {activityTotal ? (
          <>
            <div className="sf-chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.months} barCategoryGap="22%">
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="month" {...AXIS} />
                  <YAxis allowDecimals={false} width={32} {...AXIS} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "var(--chart-track)" }} />
                  {data.groups.map((group, index) => (
                    <Bar isAnimationActive={animate}
                      key={group.id}
                      dataKey={group.id}
                      name={group.name}
                      stackId="activity"
                      fill={SERIES[index]}
                      stroke={GAP}
                      strokeWidth={1}
                      radius={index === data.groups.length - 1 ? [4, 4, 0, 0] : 0}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Legend rows={data.groups.map((group) => ({ name: group.name, count: group.count, color: groupColor.get(group.id) ?? SERIES[0] }))} />
          </>
        ) : (
          <EmptyState compact icon="chart-column" title="No activity yet" description="Open a stage and explain it back. Every saved idea adds to this chart." />
        )}
      </Card>

      <Card id="chart-mix" title="Where your time goes" note="The share of everything you did in the last 12 months.">
        {activityTotal ? (
          <Donut
            rows={data.groups.map((group) => ({ name: group.name, count: group.count, color: groupColor.get(group.id) ?? SERIES[0] }))}
            total={activityTotal}
            caption="in 12 months"
            animate={animate}
          />
        ) : (
          <EmptyState compact icon="chart-pie" title="Nothing to split yet" description="The share chart appears after your first saved activity." />
        )}
        {data.kinds.length ? (
          <details className="sf-chart-details">
            <summary>Every kind, counted</summary>
            <table className="sf-chart-table">
              <tbody>
                {data.kinds.map((kind) => (
                  <tr key={kind.id}>
                    <th scope="row">{kind.name}</th>
                    <td>{kind.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ) : null}
      </Card>

      <Card
        id="chart-outcomes"
        title="How your explain-back ideas went"
        note={ideaTotal ? "Each idea is reviewed on its own. More tries are normal; an idea not passed yet is on Home." : "Each idea in an explain-back counts here once it is reviewed."}
      >
        {ideaTotal ? (
          <Donut rows={data.outcomes.map((row, index) => ({ ...row, color: SERIES[index] }))} total={ideaTotal} caption={ideaTotal === 1 ? "idea" : "ideas"} animate={animate} />
        ) : (
          <EmptyState compact icon="message-square-quote" title="No ideas reviewed yet" description="Explain a stage back to see first-answer passes and retries." />
        )}
      </Card>

      <Card id="chart-paths" title="Stages passed on each path" note="Passed stages against what is left on every path you follow.">
        {data.paths.length ? (
          <>
            <div className="sf-chart-frame" style={{ height: Math.max(140, data.paths.length * 46 + 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.paths} layout="vertical" barCategoryGap="28%">
                  <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} {...AXIS} />
                  <YAxis type="category" dataKey="name" width={118} {...AXIS} tickFormatter={(value: string) => (value.length > 16 ? `${value.slice(0, 15)}…` : value)} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "var(--chart-track)" }} />
                  <Bar isAnimationActive={animate} dataKey="passed" name="Passed" stackId="path" fill="var(--viz-1)" stroke={GAP} strokeWidth={1} />
                  <Bar isAnimationActive={animate} dataKey="left" name="Left" stackId="path" fill="var(--chart-track)" stroke={GAP} strokeWidth={1} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="sf-viz-legend">
              {data.paths.map((path) => (
                <li key={path.name}>
                  <span>{path.name}</span>
                  <strong>
                    {path.passed}/{path.passed + path.left} · {path.mastery}%
                  </strong>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState compact icon="route" title="No path followed yet" description="Follow a path from Niches and its stages show up here." />
        )}
      </Card>

      <Card
        id="chart-weekdays"
        title="Your weekly rhythm"
        note={weekdayPeak ? "Everything you did in the last year, by weekday (UTC)." : "Your busiest days show up once you have some activity."}
      >
        <div className="sf-chart-frame sf-chart-short">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.weekdays}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="day" {...AXIS} />
              <YAxis allowDecimals={false} width={32} {...AXIS} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "var(--chart-track)" }} />
              <Bar isAnimationActive={animate} dataKey="count" name="Contributions" radius={[4, 4, 0, 0]}>
                {data.weekdays.map((day) => (
                  <Cell key={day.day} fill={day.count === weekdayPeak && weekdayPeak > 0 ? "var(--viz-1)" : "var(--viz-1-soft)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card
        id="chart-growth"
        wide
        title="Mastery over time"
        note={
          data.series.length > 4
            ? "The share of each path's stages passed by the end of each month. Showing the four furthest along."
            : "The share of each path's stages passed by the end of each month."
        }
      >
        {linePaths.length ? (
          <>
            <div className="sf-chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="month" {...AXIS} />
                  <YAxis domain={[0, 100]} allowDecimals={false} width={36} {...AXIS} unit="%" />
                  <Tooltip content={<ChartTip unit="%" />} />
                  {linePaths.map((item, index) => (
                    <Line isAnimationActive={animate} key={item.key} type="monotone" dataKey={item.key} name={item.name} stroke={SERIES[index]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: GAP }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <Legend rows={linePaths.map((item, index) => ({ name: item.name, count: `${item.latest}%`, color: SERIES[index] }))} />
          </>
        ) : (
          <EmptyState compact icon="chart-line" title="No path followed yet" description="A line appears here once you follow a path." />
        )}
      </Card>

      <Card
        id="chart-recall"
        title="Recall scores"
        note={recallAverage == null ? "A passed idea comes back later as a recall. Your scores show up here." : `Your last ${data.recall.length} recalls average ${recallAverage} of 100.`}
      >
        {data.recall.length ? (
          <div className="sf-chart-frame sf-chart-short">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.recall}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="when" {...AXIS} minTickGap={16} />
                <YAxis domain={[0, 100]} width={32} {...AXIS} />
                <Tooltip content={<ChartTip />} />
                <Line isAnimationActive={animate} type="monotone" dataKey="score" name="Score" stroke="var(--viz-1)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: GAP }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState compact icon="brain" title="No recalls yet" description="Pass an idea, and it comes back for a recall about 18 hours later." />
        )}
      </Card>

      <Card id="chart-notes" title="Notes by path" note="Every idea you explained well, and every practice note, by path.">
        {data.notesByPath.length ? (
          <div className="sf-chart-frame sf-chart-short" style={{ height: Math.max(140, data.notesByPath.length * 40 + 40) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.notesByPath} layout="vertical" barCategoryGap="28%">
                <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} {...AXIS} />
                <YAxis type="category" dataKey="name" width={118} {...AXIS} tickFormatter={(value: string) => (value.length > 16 ? `${value.slice(0, 15)}…` : value)} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "var(--chart-track)" }} />
                <Bar isAnimationActive={animate} dataKey="count" name="Notes" fill="var(--viz-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState compact icon="notebook-pen" title="No notes yet" description="Each idea that holds in an explain-back is kept as a note." />
        )}
      </Card>
    </div>
  );
}
