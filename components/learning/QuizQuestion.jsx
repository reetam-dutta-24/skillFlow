"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";
import { ProgressBar } from "../core/ProgressBar.jsx";

/** One multiple-choice question with immediate feedback. */
export function QuizQuestion({ index = 1, total = 5, question, options = [], correctIndex, selected, onSelect, explanation, onNext, style, ...rest }) {
  const answered = selected != null;
  const correct = answered && selected === correctIndex;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", maxWidth: 640, ...style }} {...rest}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Question {index} of {total}</span>
        <ProgressBar value={index} max={total} height={4} />
      </div>
      <h2 style={{ margin: 0, fontSize: "var(--text-heading)", lineHeight: "var(--text-heading-lh)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", textWrap: "pretty" }}>{question}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((opt, i) => {
          const isChosen = selected === i;
          const isRight = answered && i === correctIndex;
          const isWrong = isChosen && !correct;
          const border = isRight ? "var(--state-pass)" : isWrong ? "var(--state-fail)" : "var(--border-default)";
          const bg = isRight ? "var(--state-pass-bg)" : isWrong ? "var(--state-fail-bg)" : "var(--surface-card)";
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => onSelect && onSelect(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                textAlign: "left",
                cursor: answered ? "default" : "pointer",
                borderRadius: "var(--radius-panel)",
                background: bg,
                border: "1px solid " + border,
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-body)",
                color: "var(--text-primary)",
                transition: "background var(--dur-fast) var(--ease-in-out), border-color var(--dur-fast) var(--ease-in-out)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, flexShrink: 0, borderRadius: "var(--radius-full)", border: "1px solid " + border, fontSize: "var(--text-2xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-muted)" }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
              {isRight ? <Icon name="check" size={16} color="var(--state-pass)" strokeWidth={3} /> : null}
              {isWrong ? <Icon name="x" size={16} color="var(--state-fail)" strokeWidth={3} /> : null}
            </button>
          );
        })}
      </div>
      {answered && !correct && explanation ? (
        <div style={{ display: "flex", gap: 12, padding: "16px 18px", borderRadius: "var(--radius-panel)", background: "var(--surface-card)", borderLeft: "none", border: "1px solid var(--border-default)" }}>
          <Icon name="sparkles" size={16} color="var(--accent)" />
          <div>
            <p style={{ margin: 0, fontSize: "var(--text-2xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--text-faint)" }}>From this lesson</p>
            <p style={{ margin: "5px 0 0", fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--text-secondary)", textWrap: "pretty" }}>{explanation}</p>
          </div>
        </div>
      ) : null}
      {answered ? (
        <button type="button" onClick={onNext} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, height: 44, padding: "0 24px", border: "none", cursor: "pointer", borderRadius: "var(--radius-btn)", backgroundImage: "var(--gradient-brand)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
          {index < total ? "Next question" : "Finish quiz"}
          <Icon name="arrow-right" size={15} color="#fff" />
        </button>
      ) : null}
    </section>
  );
}
