"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";

function Label({ children, htmlFor }) {
  const style = { margin: 0, fontSize: "var(--text-2xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--text-faint)" };
  if (htmlFor) return <label htmlFor={htmlFor} style={style}>{children}</label>;
  return <p style={style}>{children}</p>;
}

function Field({ id, value, onChange, placeholder, voice, onVoice, rows = 5, disabled }) {
  return (
    <div style={{ position: "relative" }}>
      <textarea
        id={id}
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
  voiceEnabled = true, onVoice, hint,
  voiceMode = "text", onVoiceModeChange, voicePhase = "idle", onStartVoice, onStopVoice, voiceNote,
  reviewing = false, continueLabel = "Continue to next stage", retryLabel = "Try the explanation again",
  style, ...rest
}) {
  const voiceBusy = voicePhase === "recording" || voicePhase === "transcribing";
  const passed = result === "pass";
  const tone = passed ? { fg: "var(--state-pass)", bg: "var(--state-pass-bg)", icon: "circle-check", title: "Milestone passed" }
                      : { fg: "var(--state-warn)", bg: "var(--state-warn-bg)", icon: "circle-alert", title: "Not quite yet" };
  return (
    <section {...rest} aria-busy={reviewing || undefined} style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: 680, ...style }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label>{stage} · Explain-back check</Label>
        <h1 style={{ margin: 0, fontSize: "var(--text-title)", lineHeight: "var(--text-title-lh)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "var(--text-primary)" }}>{concept}</h1>
        {prompt ? <p style={{ margin: 0, fontSize: "var(--text-subtitle)", lineHeight: "var(--text-subtitle-lh)", color: "var(--text-muted)", textWrap: "pretty" }}>{prompt}</p> : null}
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label htmlFor="explain-answer">Your explanation</Label>
        {onVoiceModeChange ? (
          <div className="sf-voice">
            <div className="sf-voice-toggle" role="group" aria-label="How to answer">
              <button type="button" aria-pressed={voiceMode !== "voice"} disabled={reviewing} onClick={() => onVoiceModeChange("text")}>Text</button>
              <button type="button" aria-pressed={voiceMode === "voice"} disabled={reviewing} onClick={() => onVoiceModeChange("voice")}>Voice</button>
            </div>
            {voiceMode === "voice" && voicePhase === "idle" ? (
              <button type="button" className="sf-voice-start" disabled={reviewing} onClick={onStartVoice}>Start recording</button>
            ) : null}
            {voiceMode === "voice" && voicePhase === "recording" ? (
              <div className="sf-voice-status" aria-live="polite">
                <span className="sf-voice-dot" aria-hidden="true" />
                Recording
                <button type="button" onClick={onStopVoice}>Stop</button>
              </div>
            ) : null}
            {voiceMode === "voice" && voicePhase === "transcribing" ? (
              <p className="sf-voice-status" aria-live="polite">Turning your recording into text...</p>
            ) : null}
          </div>
        ) : null}
        {voiceNote ? <p className="sf-voice-note" role="status">{voiceNote}</p> : null}
        <Field id="explain-answer" value={answer} onChange={onAnswerChange} placeholder="Explain it as if to someone who hasn't seen the lesson." voice={voiceEnabled && !onVoiceModeChange} onVoice={onVoice} disabled={!!followUp || voiceBusy || reviewing} />
        {hint ? <p className="sf-explain-hint">{hint}</p> : null}
        {!followUp && reviewing ? (
          <p className="sf-reviewing">
            <span className="sf-reviewing-spin" aria-hidden="true" />
            Reviewing your explanation...
          </p>
        ) : null}
        {!followUp && onSubmitAnswer && !reviewing && !voiceBusy ? (
          <button type="button" onClick={onSubmitAnswer} disabled={!answer.trim()} style={{ alignSelf: "flex-start", height: 44, padding: "0 24px", border: "none", cursor: answer.trim() ? "pointer" : "not-allowed", opacity: answer.trim() ? 1 : 0.55, borderRadius: "var(--radius-btn)", backgroundImage: "var(--gradient-brand)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>Submit explanation</button>
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
          <Label htmlFor="explain-follow-up">Your response</Label>
          <Field id="explain-follow-up" value={followUpAnswer} onChange={onFollowUpChange} placeholder="Answer the follow-up in your own words." rows={4} voice={voiceEnabled && !onVoiceModeChange} onVoice={onVoice} disabled={!!result || reviewing} />
          {reviewing ? (
            <p className="sf-reviewing">
              <span className="sf-reviewing-spin" aria-hidden="true" />
              Reviewing your explanation...
            </p>
          ) : null}
          {!result && onSubmitFollowUp && !reviewing ? (
            <button type="button" onClick={onSubmitFollowUp} disabled={!followUpAnswer.trim()} style={{ alignSelf: "flex-start", height: 44, padding: "0 24px", border: "none", cursor: followUpAnswer.trim() ? "pointer" : "not-allowed", opacity: followUpAnswer.trim() ? 1 : 0.55, borderRadius: "var(--radius-btn)", backgroundImage: "var(--gradient-brand)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>Submit response</button>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div id="explain-result" tabIndex={-1} style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 22px", borderRadius: "var(--radius-card)", background: tone.bg, border: "1px solid " + tone.fg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name={tone.icon} size={18} color={tone.fg} />
            <p style={{ margin: 0, fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-semibold)", color: tone.fg }}>{tone.title}</p>
          </div>
          <p style={{ margin: 0, fontSize: "var(--text-body)", lineHeight: 1.6, color: "var(--text-secondary)", textWrap: "pretty" }}>{resultFeedback}</p>
          <div style={{ display: "flex", gap: 10 }}>
            {passed ? (
              <button type="button" onClick={onContinue} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 44, padding: "0 24px", border: "none", cursor: "pointer", borderRadius: "var(--radius-btn)", backgroundImage: "var(--gradient-brand)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
                {continueLabel}
                <Icon name="arrow-right" size={15} color="#fff" />
              </button>
            ) : (
              <button type="button" onClick={onRetry} style={{ height: 44, padding: "0 24px", cursor: "pointer", borderRadius: "var(--radius-btn)", background: "transparent", border: "1px solid var(--border-strong)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>{retryLabel}</button>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
