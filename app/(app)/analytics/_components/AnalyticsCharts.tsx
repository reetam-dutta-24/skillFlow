"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import type { AnalyticsData } from "@/lib/data/analytics";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

type TipRow = { name?: string; value?: number | string; color?: string };

function ChartTip({ active, payload, label }: { active?: boolean; payload?: TipRow[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="sf-chart-tip">
      {label ? <p>{label}</p> : null}
      {payload.map((item) => (
        <p key={`${item.name}-${item.value}`}>
          <span style={{ background: item.color }} />
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

function countSentence(rows: { name: string; count: number }[]) {
  return `${rows.map((row) => `${row.count} ${row.name.toLowerCase()}`).join(". ")}.`;
}

export function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const leading = [...data.skills].sort((a, b) => b.mastery - a.mastery)[0];
  const showPie = data.skills.some((skill) => skill.mastery > 0);
  const history = data.history.map((row) => ({ month: row.month, ...row.values }));
  return (
    <div className="sf-analytics-grid">
      <section className="sf-chart-card" aria-labelledby="chart-mastery">
        <header>
          <h2 id="chart-mastery">Where mastery sits</h2>
          <p>
            {showPie
              ? `${leading?.name} holds the largest share of verified mastery.`
              : data.skills.length
                ? "Every followed skill is still at 0% verified mastery."
                : "Follow a skill to see the split."}
          </p>
        </header>
        {showPie ? (
          <div className="sf-chart-frame sf-chart-pie">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.skills} dataKey="mastery" nameKey="name" innerRadius={68} outerRadius={96} paddingAngle={3} stroke="none">
                  {data.skills.map((skill, index) => (
                    <Cell key={skill.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            {leading ? (
              <p className="sf-pie-center">
                <strong>{leading.mastery}%</strong>
                <span>leading skill</span>
              </p>
            ) : null}
          </div>
        ) : (
          <EmptyState
            compact
            icon="chart-pie"
            title={data.skills.length ? "No verified mastery yet" : "No skill followed yet"}
            description={
              data.skills.length
                ? "The share chart appears once a stage is passed."
                : "Progress on a saved skill will split across this chart."
            }
          />
        )}
        {data.skills.length ? (
          <ul className="sf-pie-legend">
            {data.skills.map((skill) => (
              <li key={skill.name}>{skill.name}: {skill.mastery}% verified mastery</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="sf-chart-card" aria-labelledby="chart-week">
        <header>
          <h2 id="chart-week">Explain-backs this week</h2>
          <p>Each bar is an explain-back saved on that UTC day. A day with none stays at zero.</p>
        </header>
        {data.week.length ? (
          <div className="sf-chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.week}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="checks" name="Check-ins" radius={[8, 8, 0, 0]}>
                  {data.week.map((day) => (
                    <Cell key={day.day} fill={day.checks === 0 ? "var(--chart-track)" : "var(--chart-1)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            compact
            icon="calendar"
            title="No daily check-ins yet"
            description="A weekday chart appears once this account has a saved explain-back."
          />
        )}
      </section>

      <section className="sf-chart-card sf-chart-wide" aria-labelledby="chart-growth">
        <header>
          <h2 id="chart-growth">Mastery over time</h2>
          <p>Each point is the share of open stages passed by the end of that month. Locked stages stay out of the count.</p>
        </header>
        {data.series.length ? (
          <div className="sf-chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
                <YAxis domain={[0, 100]} allowDecimals={false} stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
                <Tooltip content={<ChartTip />} />
                <Legend />
                {data.series.map((item, index) => (
                  <Line
                    key={item.key}
                    type="monotone"
                    dataKey={item.key}
                    name={item.name}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            compact
            icon="chart-line"
            title="No skill followed yet"
            description="A line appears here once a skill is saved on the account."
          />
        )}
      </section>

      <section className="sf-chart-card" aria-labelledby="chart-explain">
        <header>
          <h2 id="chart-explain">Explain-back</h2>
          <p>{countSentence(data.explain)} These are saved attempts.</p>
        </header>
        <div className="sf-chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.explain}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
              <YAxis allowDecimals={false} stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" name="Checks" radius={[8, 8, 0, 0]}>
                {data.explain.map((row, index) => (
                  <Cell key={row.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
