"use client";

import { useEffect, useState } from "react";
import { customAccentToken, customThemeVars, parseHex, rgbToHex } from "@/lib/accent-color";

/** Palette, hex, and RGB for one gradient stop. */
function StopFields({ label, value, onHex }) {
  const [draft, setDraft] = useState(value);
  const parsed = parseHex(draft) ?? parseHex(value);
  const picker = parsed ? rgbToHex(parsed) : value;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit(next) {
    setDraft(next);
    const color = parseHex(next);
    if (color) onHex(rgbToHex(color));
  }

  function setChannel(channel, raw) {
    if (!parsed) return;
    const number = Number(raw);
    if (!Number.isInteger(number) || number < 0 || number > 255) return;
    onHex(rgbToHex({ ...parsed, [channel]: number }));
  }

  return (
    <fieldset className="sf-accent-stop">
      <legend>{label}</legend>
      <div className="sf-accent-stop-row">
        <input
          type="color"
          aria-label={`${label} palette`}
          value={picker}
          onChange={(event) => commit(event.target.value)}
        />
        <label>
          Hex
          <input
            type="text"
            inputMode="text"
            spellCheck={false}
            maxLength={7}
            value={draft}
            aria-label={`${label} hex`}
            onChange={(event) => commit(event.target.value)}
          />
        </label>
      </div>
      <div className="sf-accent-rgb">
        {["r", "g", "b"].map((channel) => (
          <label key={channel}>
            {channel.toUpperCase()}
            <input
              type="number"
              min={0}
              max={255}
              inputMode="numeric"
              value={parsed ? parsed[channel] : 0}
              aria-label={`${label} ${channel.toUpperCase()}`}
              onChange={(event) => setChannel(channel, event.target.value)}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Two stops. The first is the deep end of the gradient, the second is the bright end. */
export function CustomAccentForm({ start, end, onChange }) {
  const preview = customThemeVars(start, end);

  function changeStart(hex) {
    const token = customAccentToken(hex, end);
    if (token) onChange(token);
  }

  function changeEnd(hex) {
    const token = customAccentToken(start, hex);
    if (token) onChange(token);
  }

  return (
    <div className="sf-accent-custom">
      <div className="sf-accent-stops">
        <StopFields label="Gradient start" value={start} onHex={changeStart} />
        <StopFields label="Gradient end" value={end} onHex={changeEnd} />
      </div>
      {preview ? (
        <div className="sf-accent-preview" style={{ backgroundImage: preview["--preset-gradient"] }}>
          <span style={{ color: preview["--text-on-accent"] }}>Your gradient</span>
        </div>
      ) : null}
    </div>
  );
}
