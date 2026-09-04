import React from "react";

/** Single-value mastery donut, or a multi-slice breakdown. */
export function DonutChart({ value, slices, label, size = 160, thickness = 14, style, ...rest }) {
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  const data = slices || [{ label: label || "Mastery", value: value || 0, color: "var(--chart-1)" }];
  const total = slices ? slices.reduce((s, d) => s + d.value, 0) : 100;
  let acc = 0;
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, ...style }} {...rest}>
      <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} role="img" style={{ flexShrink: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-track)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const frac = total ? d.value / total : 0;
          const dash = c * frac;
          const el = (
            <circle
              key={d.label}
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke={d.color || colors[i % colors.length]}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={dash + " " + (c - dash)}
              strokeDashoffset={-acc}
              transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"}
            />
          );
          acc += dash;
          return el;
        })}
        {!slices ? (
          <g>
            <text x="50%" y="48%" textAnchor="middle" fill="var(--text-primary)" fontSize={size * 0.22} fontWeight="700" fontFamily="var(--font-sans)">{Math.round(value || 0)}%</text>
            <text x="50%" y="63%" textAnchor="middle" fill="var(--text-muted)" fontSize={size * 0.075} fontFamily="var(--font-sans)">mastery</text>
          </g>
        ) : null}
      </svg>
      {slices ? (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {slices.map((d, i) => (
            <li key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "var(--radius-full)", background: d.color || colors[i % colors.length] }} />
              <span style={{ flex: 1 }}>{d.label}</span>
              <span style={{ fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{d.value}%</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
