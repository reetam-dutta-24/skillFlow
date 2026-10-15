"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "framer-motion";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import type { DetoxWeek } from "@/lib/detox/score";

/** The validated categorical slots from globals.css, in fixed order. Never cycled. */
const SERIES = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)"];
const AXIS = { stroke: "var(--chart-axis)", tick: { fill: "var(--chart-axis)", fontSize: 12 } };
const GAP = "var(--surface-card)";

type TipRow = { name?: string; value?: number | string | null; color?: string; payload?: { fill?: string } };

function ChartTip({ active, payload, label }: { active?: boolean; payload?: TipRow[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="sf-chart-tip">
      {label !== undefined && label !== "" ? <p className="sf-chart-tip-label">Week of {label}</p> : null}
      {payload
        .filter((item) => item.value !== null && item.value !== undefined)
        .map((item) => (
          <p key={`${item.name}-${item.value}`}>
            <span style={{ background: item.color ?? item.payload?.fill }} />
            {item.name}: {item.value}
          </p>
        ))}
    </div>
  );
}

function Legend({ rows }: { rows: { name: string; value: string | number; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="sf-viz-legend">
      {rows.map((row) => (
        <li key={row.name}>
          <span className="sf-viz-swatch" data-dashed={row.dashed ? "true" : undefined} style={{ background: row.dashed ? "transparent" : row.color, borderColor: row.color }} aria-hidden="true" />
          <span>{row.name}</span>
          <strong>{row.value}</strong>
        </li>
      ))}
    </ul>
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

/** Score over time. Also shown on its own in the Analytics Detox section. */
function ScoreCard({ weeks, baseline, score, animate }: { weeks: DetoxWeek[]; baseline: number; score: number; animate: boolean }) {
  return (
    <Card
        id="dtx-chart-score"
        wide
        title="Your Detox Score over time"
        note={`Where your score ended each week. The dashed line is where you started (${baseline}).`}
      >
        <div className="sf-chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeks}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" {...AXIS} minTickGap={12} />
              <YAxis domain={[-100, 100]} ticks={[-100, -50, 0, 50, 100]} width={40} {...AXIS} />
              <Tooltip content={<ChartTip />} />
              <ReferenceLine y={baseline} stroke="var(--chart-axis)" strokeDasharray="5 5" />
              <Line isAnimationActive={animate} type="monotone" dataKey="score" name="Detox Score" stroke={SERIES[0]} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, stroke: GAP }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Legend
          rows={[
            { name: "Detox Score now", value: score, color: SERIES[0] },
            { name: "Where you started", value: baseline, color: "var(--chart-axis)", dashed: true },
          ]}
        />
      </Card>
  );
}

export function DetoxScoreChart({ weeks, baseline, score }: { weeks: DetoxWeek[]; baseline: number; score: number }) {
  const animate = !useReducedMotion();
  return (
    <div className="sf-analytics-grid sf-dtx-charts">
      <ScoreCard weeks={weeks} baseline={baseline} score={score} animate={animate} />
    </div>
  );
}

export function DetoxCharts({
  weeks,
  baseline,
  score,
  mix,
}: {
  weeks: DetoxWeek[];
  baseline: number;
  score: number;
  mix: { kind: string; label: string; count: number }[];
}) {
  const animate = !useReducedMotion();
  const checkIns = weeks.filter((week) => week.selfFocus !== null).length;
  const focusTotal = weeks.reduce((sum, week) => sum + week.focusMinutes, 0);
  const learningTotal = weeks.reduce((sum, week) => sum + week.learning, 0);
  const mixTotal = mix.reduce((sum, row) => sum + row.count, 0);
  const mixRows = mix.slice(0, 4);

  return (
    <div className="sf-analytics-grid sf-dtx-charts">
      <ScoreCard weeks={weeks} baseline={baseline} score={score} animate={animate} />

      <Card
        id="dtx-chart-focus"
        title="How focus felt, and what you did"
        note={checkIns ? "Bars are focused minutes the app counted. The line is the focus you rated in each check-in." : "Do a weekly check-in to see how your rating lines up with your focused minutes."}
      >
        {focusTotal || checkIns ? (
          <>
            <div className="sf-chart-frame sf-chart-short">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeks}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="label" {...AXIS} minTickGap={12} />
                  <YAxis yAxisId="minutes" allowDecimals={false} width={36} {...AXIS} />
                  <YAxis yAxisId="rating" orientation="right" domain={[1, 5]} ticks={[1, 3, 5]} width={24} {...AXIS} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "var(--chart-track)" }} />
                  <Bar isAnimationActive={animate} yAxisId="minutes" dataKey="focusMinutes" name="Focused minutes" fill={SERIES[0]} radius={[4, 4, 0, 0]} />
                  <Line isAnimationActive={animate} yAxisId="rating" type="monotone" dataKey="selfFocus" name="Focus you rated" stroke={SERIES[1]} strokeWidth={2} connectNulls dot={{ r: 4, strokeWidth: 2, stroke: GAP }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <Legend
              rows={[
                { name: "Focused minutes", value: focusTotal, color: SERIES[0] },
                { name: "Check-ins", value: checkIns, color: SERIES[1] },
              ]}
            />
          </>
        ) : (
          <EmptyState compact icon="timer" title="No focus data yet" description="Start a focus session or do this week's check-in." />
        )}
      </Card>

      <Card
        id="dtx-chart-life"
        title="Your life vs your learning"
        note="Bars are verified learning actions each week. The line is the daily screen time you reported."
      >
        {learningTotal || checkIns ? (
          <>
            <div className="sf-chart-frame sf-chart-short">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeks}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="label" {...AXIS} minTickGap={12} />
                  <YAxis yAxisId="actions" allowDecimals={false} width={32} {...AXIS} />
                  <YAxis yAxisId="hours" orientation="right" domain={[0, 8]} width={28} {...AXIS} unit="h" />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "var(--chart-track)" }} />
                  <Bar isAnimationActive={animate} yAxisId="actions" dataKey="learning" name="Learning actions" fill={SERIES[2]} radius={[4, 4, 0, 0]} />
                  <Line isAnimationActive={animate} yAxisId="hours" type="monotone" dataKey="screenHours" name="Screen time (h a day)" stroke={SERIES[3]} strokeWidth={2} connectNulls dot={{ r: 4, strokeWidth: 2, stroke: GAP }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <Legend
              rows={[
                { name: "Learning actions", value: learningTotal, color: SERIES[2] },
                { name: "Screen time reports", value: checkIns, color: SERIES[3] },
              ]}
            />
          </>
        ) : (
          <EmptyState compact icon="scale" title="Nothing to compare yet" description="Explain an idea and do a check-in; both show up here." />
        )}
      </Card>

      <Card id="dtx-chart-mix" wide title="What moved your score" note="Every verified action since your self-check, by kind.">
        {mixTotal ? (
          <div className="sf-viz-donut">
            <div className="sf-chart-frame sf-chart-pie">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={animate} data={mixRows} dataKey="count" nameKey="label" innerRadius="62%" outerRadius="88%" paddingAngle={2} stroke={GAP} strokeWidth={2}>
                    {mixRows.map((row, index) => (
                      <Cell key={row.kind} fill={SERIES[index]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTip label="" />} />
                </PieChart>
              </ResponsiveContainer>
              <p className="sf-pie-center">
                <strong>{mixTotal}</strong>
                <span>{mixTotal === 1 ? "action" : "actions"}</span>
              </p>
            </div>
            <Legend rows={[...mixRows.map((row, index) => ({ name: row.label, value: row.count, color: SERIES[index] })), ...mix.slice(4).map((row) => ({ name: row.label, value: row.count, color: "var(--chart-track)" }))]} />
          </div>
        ) : (
          <EmptyState compact icon="chart-pie" title="Nothing counted yet" description="Explain one idea and it shows up here." />
        )}
      </Card>
    </div>
  );
}
