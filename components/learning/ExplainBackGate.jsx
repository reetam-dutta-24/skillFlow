"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";

function Label({ children }) {
  return <p style={{ margin: 0, fontSize: "var(--text-2xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--text-faint)" }}>{children}</p>;
}

function Field({ value, onChange, placeholder, voice, onVoice, rows = 5, disabled }) {
  return (
    <div style={{ position: "relative" }}>
      <textarea
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={{ width: "100%", resize: "vertical", padding: "14px 16px", paddingBottom: voice ? 46 : 14, borderRadius: "var(--radius-panel)", background: "var(--surface-card)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "var(--text-body)", lineHeight: 1.6, outline: "none" }}
      />
      {voice ? (
        <button type="button" onClick={onVoice} style={{ position: "absolute", left: 12, bottom: 12, display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 12px", cursor: "pointer", borderRadius: "var(--radius-full)", background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: "var(--text-2xs)" }}>
          <Icon name="mic" size={12} />
          Speak instead
        </button>
      ) : null}
    </div>
  );
}

/** The explain-back milestone gate — SkillFlow's core differentiator. */
export function ExplainBackGate({
  stage, concept, prompt,
  answer = "", onAnswerChange, onSubmitAnswer,
  followUp, followUpAnswer = "", onFollowUpChange, onSubmitFollowUp,
  result, resultFeedback, onContinue, onRetry,
  voiceEnabled = true, onVoice,
  style, ...rest
}) {
  const passed = result === "pass";
  const tone = passed ? { fg: "var(--state-pass)", bg: "var(--state-pass-bg)", icon: "circle-check", title: "Milestone passed" }
                      : { fg: "var(--state-warn)", bg: "var(--state-warn-bg)", icon: "circle-alert", title: "Not quite yet" };
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: 680, ...style }} {...rest}>
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label>{stage} · Explain-back check</Label>
        <h1 style={{ margin: 0, fontSize: "var(--text-title)", lineHeight: "var(--text-title-lh)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "var(--text-primary)" }}>{concept}</h1>
        {prompt ? <p style={{ margin: 0, fontSize: "var(--text-subtitle)", lineHeight: "var(--text-subtitle-lh)", color: "var(--text-muted)", textWrap: "pretty" }}>{prompt}</p> : null}
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label>Your explanation</Label>
        <Field value={answer} onChange={onAnswerChange} placeholder="Explain it as if to someone who hasn't seen the lesson." voice={voiceEnabled} onVoice={onVoice} disabled={!!followUp} />
        {!followUp ? (
          <button type="button" onClick={onSubmitAnswer} style={{ alignSelf: "flex-start", height: 44, padding: "0 24px", border: "none", cursor: "pointer", borderRadius: "var(--radius-btn)", backgroundImage: "var(--gradient-brand)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>Submit explanation</button>
        ) : null}
      </div>

      {followUp ? (
        <div style={{ display: "flex", gap: 14, padding: "18px 20px", borderRadius: "var(--radius-card)", background: "var(--surface-card-accent)", border: "1px solid var(--border-accent)" }}>
          <Icon name="message-square-quote" size={18} color="var(--accent)" />
          <div style={{ minWidth: 0 }}>
            <Label>Follow-up question</Label>
            <p style={{ margin: "6px 0 0", fontSize: "var(--text-subtitle)", lineHeight: "var(--text-subtitle-lh)", color: "var(--text-primary)", textWrap: "pretty" }}>{followUp}</p>
          </div>
        </div>
      ) : null}

      {followUp ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Label>Your response</Label>
          <Field value={followUpAnswer} onChange={onFollowUpChange} placeholder="Answer the follow-up in your own words." rows={4} voice={voiceEnabled} onVoice={onVoice} disabled={!!result} />
          {!result ? (
            <button type="button" onClick={onSubmitFollowUp} style={{ alignSelf: "flex-start", height: 44, padding: "0 24px", border: "none", cursor: "pointer", borderRadius: "var(--radius-btn)", backgroundImage: "var(--gradient-brand)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>Submit response</button>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 22px", borderRadius: "var(--radius-card)", background: tone.bg, border: "1px solid " + tone.fg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name={tone.icon} size={18} color={tone.fg} />
            <p style={{ margin: 0, fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-semibold)", color: tone.fg }}>{tone.title}</p>
          </div>
          <p style={{ margin: 0, fontSize: "var(--text-body)", lineHeight: 1.6, color: "var(--text-secondary)", textWrap: "pretty" }}>{resultFeedback}</p>
          <div style={{ display: "flex", gap: 10 }}>
            {passed ? (
              <button type="button" onClick={onContinue} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 44, padding: "0 24px", border: "none", cursor: "pointer", borderRadius: "var(--radius-btn)", backgroundImage: "var(--gradient-brand)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
                Continue to next stage
                <Icon name="arrow-right" size={15} color="#fff" />
              </button>
            ) : (
              <button type="button" onClick={onRetry} style={{ height: 44, padding: "0 24px", cursor: "pointer", borderRadius: "var(--radius-btn)", background: "transparent", border: "1px solid var(--border-strong)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>Try the explanation again</button>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
