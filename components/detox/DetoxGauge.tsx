"use client";

import { useEffect, useId, useState } from "react";
import { animate } from "framer-motion";
import { BANDS, bandFor, SCORE_MAX, SCORE_MIN } from "@/lib/detox/score";

/**
 * The Detox Score as a half dial from -100 to +100, with the four bands as a quiet track. It sweeps from `from` (last
 * week's score) to `score` once. The number is drawn for the eye; screen readers get one plain sentence instead.
 */

const CX = 130;
const CY = 128;
const R = 104;

function angleOf(value: number) {
  const share = (Math.max(SCORE_MIN, Math.min(SCORE_MAX, value)) - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
  return Math.PI * (1 - share);
}

function point(value: number, radius = R) {
  const angle = angleOf(value);
  return { x: CX + radius * Math.cos(angle), y: CY - radius * Math.sin(angle) };
}

function arc(from: number, to: number, radius = R) {
  const a = point(from, radius);
  const b = point(to, radius);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

/** A real minus sign, and a plus for anything above zero. */
export function signed(value: number) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return "0";
}

const BAND_TONE = ["var(--viz-2)", "var(--viz-4)", "var(--viz-3)", "var(--viz-1)"];

export function DetoxGauge({
  score,
  from,
  reduce,
  size = "lg",
  onSettled,
}: {
  score: number;
  from: number;
  reduce: boolean;
  size?: "lg" | "sm";
  onSettled?: () => void;
}) {
  const gradientId = useId();
  const [animated, setAnimated] = useState(from);
  const shown = reduce ? score : animated;

  useEffect(() => {
    if (reduce) {
      onSettled?.();
      return undefined;
    }
    const controls = animate(from, score, {
      duration: Math.min(1.1, 0.45 + Math.abs(score - from) / 120),
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => setAnimated(value),
      onComplete: () => onSettled?.(),
    });
    return () => controls.stop();
    // Runs once per score; `onSettled` is a callback from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, from, reduce]);

  const band = bandFor(score);
  const knob = point(shown);
  const edges = [SCORE_MIN, ...BANDS.slice(1).map((item) => item.min), SCORE_MAX];

  return (
    <figure className="sf-gauge" data-size={size} aria-label={`Detox Score ${signed(score)} out of 100, band ${band.label}`} role="img">
      <svg viewBox="0 0 260 150" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--gauge-from)" />
            <stop offset="100%" stopColor="var(--gauge-to)" />
          </linearGradient>
        </defs>
        {BANDS.map((item, index) => (
          <path
            key={item.id}
            className="sf-gauge-band"
            d={arc(edges[index] + (index === 0 ? 0 : 1.2), edges[index + 1] - (index === BANDS.length - 1 ? 0 : 1.2))}
            stroke={BAND_TONE[index]}
          />
        ))}
        <path className="sf-gauge-track" d={arc(SCORE_MIN, SCORE_MAX, R - 16)} />
        {shown > SCORE_MIN + 0.5 ? <path className="sf-gauge-fill" d={arc(SCORE_MIN, shown, R - 16)} stroke={`url(#${gradientId})`} /> : null}
        <circle className="sf-gauge-knob" cx={point(shown, R - 16).x} cy={point(shown, R - 16).y} r="9" />
        <circle className="sf-gauge-tick" cx={knob.x} cy={knob.y} r="3.5" />
        <text className="sf-gauge-end" x={CX - R} y={CY + 20} textAnchor="middle">
          {"−100"}
        </text>
        <text className="sf-gauge-end" x={CX + R} y={CY + 20} textAnchor="middle">
          +100
        </text>
      </svg>
      <figcaption className="sf-gauge-center" aria-hidden="true">
        <strong>{signed(Math.round(shown))}</strong>
        <span>Detox Score</span>
      </figcaption>
    </figure>
  );
}
