"use client";

import React from "react";
import { saveAccent } from "@/app/(app)/settings/actions";
import { parseCustomAccent } from "@/lib/accent-color";
import { ACCENTS, applyStoredAccent, isStoredAccent, readStoredAccent } from "@/lib/accent";
import { CustomAccentForm } from "./CustomAccentForm.jsx";

const DEFAULT_CUSTOM = "custom:#6d28d9:#2563eb";

/**
 * Curated accent presets, plus a custom gradient.
 * Writes data-accent on the document and persists the choice.
 * Surfaces stay on the dark/light theme; the accent and its tint change.
 */
export function AccentPicker({
  accent: accentProp,
  defaultAccent = "tide",
  onChange,
  target,
  style,
  ...rest
}) {
  const [uncontrolledAccent, setUncontrolledAccent] = React.useState(defaultAccent);
  const [customOpen, setCustomOpen] = React.useState(() => parseCustomAccent(defaultAccent) !== null);
  const accent = accentProp ?? uncontrolledAccent;
  const custom = parseCustomAccent(accent);
  const current = ACCENTS.find((item) => item.id === accent);
  const saveTimer = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  React.useEffect(() => {
    if (accentProp !== undefined) return;
    const stored = readStoredAccent();
    const next = stored ?? (isStoredAccent(defaultAccent) ? defaultAccent : null);
    if (!next) return;
    setUncontrolledAccent(next);
    if (parseCustomAccent(next)) setCustomOpen(true);
    if (!stored) applyStoredAccent(next);
  }, [accentProp, defaultAccent]);

  function commit(next) {
    applyStoredAccent(next, target);
    if (accentProp === undefined) setUncontrolledAccent(next);
    if (onChange) onChange(next);
    if (target && target !== document.documentElement) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    const delay = next.startsWith("custom:") ? 400 : 0;
    saveTimer.current = window.setTimeout(() => {
      void saveAccent(next);
    }, delay);
  }

  function pickPreset(id) {
    setCustomOpen(false);
    commit(id);
  }

  function openCustom() {
    setCustomOpen(true);
    if (!custom) commit(DEFAULT_CUSTOM);
  }

  const dot = {
    width: 28,
    height: 28,
    padding: 0,
    border: "none",
    cursor: "pointer",
    borderRadius: "var(--radius-full)",
    flexShrink: 0,
  };

  return (
    <div className="sf-accent-picker" style={style} {...rest}>
      <div role="group" aria-label="Accent color" className="sf-accent-presets">
        <span className="sf-accent-current">{current ? current.label : "Custom"}</span>
        <span className="sf-accent-swatches">
          {ACCENTS.map((option) => {
            const active = accent === option.id;
            return (
              <button
                key={option.id}
                type="button"
                data-accent-swatch={option.id}
                aria-pressed={active}
                aria-label={`${option.label} accent`}
                onClick={() => pickPreset(option.id)}
                style={{
                  ...dot,
                  boxShadow: active
                    ? "0 0 0 2px var(--bg-app), 0 0 0 4px var(--text-primary), var(--glow-accent-soft)"
                    : "none",
                }}
              />
            );
          })}
          <button
            type="button"
            className="sf-accent-custom-swatch"
            aria-pressed={Boolean(custom)}
            aria-expanded={customOpen}
            aria-label="Custom gradient"
            onClick={openCustom}
            style={{
              ...dot,
              backgroundImage: custom
                ? `linear-gradient(135deg, ${custom.start}, ${custom.end})`
                : "conic-gradient(from 180deg, #ff4d9a, #c8ff3d, #22e7ff, #7a8cff, #ff4d9a)",
              boxShadow: custom
                ? "0 0 0 2px var(--bg-app), 0 0 0 4px var(--text-primary), var(--glow-accent-soft)"
                : "none",
            }}
          />
        </span>
      </div>
      {customOpen ? (
        <CustomAccentForm
          start={custom?.start ?? "#6d28d9"}
          end={custom?.end ?? "#2563eb"}
          onChange={(token) => {
            setCustomOpen(true);
            commit(token);
          }}
        />
      ) : null}
    </div>
  );
}
