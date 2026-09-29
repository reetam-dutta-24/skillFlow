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

export function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const leading = [...data.skills].sort((a, b) => b.mastery - a.mastery)[0];
  return (
    <div className="sf-analytics-grid">
      <section className="sf-chart-card" aria-labelledby="chart-mastery">
        <header>
          <h2 id="chart-mastery">Where mastery sits</h2>
          <p>{leading ? `${leading.name} holds the largest share of verified mastery.` : "Follow a skill to see the split."}</p>
        </header>
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
        <ul className="sf-pie-legend">
          {data.skills.map((skill) => (
            <li key={skill.name}>{skill.name}: {skill.mastery}% verified mastery</li>
          ))}
        </ul>
      </section>

      <section className="sf-chart-card" aria-labelledby="chart-week">
        <header>
          <h2 id="chart-week">Check-ins this week</h2>
          <p>A zero is a gap, not a failure. Saturday is carrying this week.</p>
        </header>
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
        <table className="sf-chart-table">
          <caption>Check-ins by weekday</caption>
          <thead>
            <tr>
              {data.week.map((day) => (
                <th key={day.day} scope="col">{day.day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {data.week.map((day) => (
                <td key={day.day}>{day.checks}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="sf-chart-card sf-chart-wide" aria-labelledby="chart-growth">
        <header>
          <h2 id="chart-growth">Mastery since April</h2>
          <p>Both skills are climbing. Full-Stack is the steeper line.</p>
        </header>
        <div className="sf-chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.history}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
              <YAxis stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
              <Tooltip content={<ChartTip />} />
              <Legend />
              <Line type="monotone" dataKey="fullStack" name="Full-Stack" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="art" name="Art & Painting" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <table className="sf-chart-table">
          <caption>Mastery percent by month</caption>
          <thead>
            <tr>
              <th scope="col">Skill</th>
              {data.history.map((point) => (
                <th key={point.month} scope="col">{point.month}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Full-Stack</th>
              {data.history.map((point) => (
                <td key={point.month}>{point.fullStack}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Art & Painting</th>
              {data.history.map((point) => (
                <td key={point.month}>{point.art}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="sf-chart-card" aria-labelledby="chart-quiz">
        <header>
          <h2 id="chart-quiz">Quiz results</h2>
          <p>Most quizzes cleared the pass mark. The rest are a reason to review, not a penalty.</p>
        </header>
        <div className="sf-chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.quizzes}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
              <YAxis allowDecimals={false} stroke="var(--chart-axis)" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" name="Quizzes" radius={[8, 8, 0, 0]}>
                {data.quizzes.map((row, index) => (
                  <Cell key={row.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="sf-chart-card" aria-labelledby="chart-explain">
        <header>
          <h2 id="chart-explain">Explain-back</h2>
          <p>A retry means the explanation needed another pass. It does not lower the score, because there is no score.</p>
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
