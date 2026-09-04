import React from "react";

/** Mastery-over-time line chart. Recharts in AniVerse; inline SVG here. */
export function LineChart({ data = [], series = [], height = 260, yMax, style, ...rest }) {
  const w = 720, pad = { t: 12, r: 12, b: 26, l: 34 };
  const keys = series.length ? series : [{ key: "value", label: "Value" }];
  const max = yMax || Math.max(10, ...data.flatMap((d) => keys.map((s) => Number(d[s.key]) || 0))) * 1.1;
  const iw = w - pad.l - pad.r, ih = height - pad.t - pad.b;
  const x = (i) => pad.l + (data.length > 1 ? (i / (data.length - 1)) * iw : iw / 2);
  const y = (v) => pad.t + ih - (Math.max(0, v) / max) * ih;
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
  return (
    <div style={{ width: "100%", ...style }} {...rest}>
      <svg viewBox={"0 0 " + w + " " + height} width="100%" height={height} role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={w - pad.r} y1={pad.t + ih * f} y2={pad.t + ih * f} stroke="var(--chart-grid)" strokeDasharray="4 4" />
            <text x={pad.l - 8} y={pad.t + ih * f + 4} textAnchor="end" fill="var(--chart-axis)" fontSize="10" fontFamily="var(--font-sans)">{Math.round(max * (1 - f))}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fill="var(--chart-axis)" fontSize="10" fontFamily="var(--font-sans)">{d.label}</text>
        ))}
        {keys.map((s, si) => {
          const pts = data.map((d, i) => x(i) + "," + y(Number(d[s.key]) || 0)).join(" ");
          return (
            <g key={s.key}>
              <polyline points={pts} fill="none" stroke={s.color || colors[si % colors.length]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {data.map((d, i) => (
                <circle key={i} cx={x(i)} cy={y(Number(d[s.key]) || 0)} r="3" fill={s.color || colors[si % colors.length]} />
              ))}
            </g>
          );
        })}
      </svg>
      {keys.length > 1 ? (
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
          {keys.map((s, si) => (
            <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              <span style={{ width: 10, height: 2, borderRadius: 2, background: s.color || colors[si % colors.length] }} />
              {s.label || s.key}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
