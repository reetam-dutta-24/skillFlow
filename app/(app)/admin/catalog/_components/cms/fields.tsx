"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/core/Icon.jsx";

export { cmsHref } from "./href";

/** A titled group of fields. Forms are split into these instead of one long column. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="sf-cms-section">
      <legend>{title}</legend>
      {description ? <p className="sf-cms-section-note">{description}</p> : null}
      <div className="sf-cms-fields">{children}</div>
    </fieldset>
  );
}

/** Label above the control, an optional hint, and an inline error tied to the control. */
export function Field({
  label,
  hint,
  error,
  required,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wide?: boolean;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={wide ? "sf-cms-field is-wide" : "sf-cms-field"}>
      <label htmlFor={id}>
        {label}
        {required ? <span className="sf-cms-required" aria-hidden="true"> *</span> : null}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint ? (
        <p className="sf-cms-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="sf-cms-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * One item per line, edited as a list: add, remove, and move rows. Stored as newline-joined text, which is
 * what the catalog actions already accept, so nothing on the server changes.
 */
export function LinesField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  addLabel,
  required,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  addLabel: string;
  required?: boolean;
}) {
  const id = useId();
  // The rows live in state, so a new empty row survives: joined as text, one empty row and no rows look the same.
  // When the value changes from outside (an AI suggestion, say), the rows are rebuilt from it.
  const [lines, setLines] = useState<string[]>(() => (value.length ? value.split("\n") : []));
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setLines(value.length ? value.split("\n") : []);
  }
  const set = (next: string[]) => {
    const text = next.join("\n");
    setLines(next);
    setSynced(text);
    onChange(text);
  };
  return (
    <div className="sf-cms-field is-wide">
      <span className="sf-cms-label" id={`${id}-label`}>
        {label}
        {required ? <span className="sf-cms-required" aria-hidden="true"> *</span> : null}
      </span>
      {hint ? <p className="sf-cms-hint">{hint}</p> : null}
      <ol className="sf-cms-lines" aria-labelledby={`${id}-label`}>
        {lines.map((line, index) => (
          <li key={index}>
            <span className="sf-cms-line-num" aria-hidden="true">
              {index + 1}
            </span>
            <input
              value={line}
              placeholder={placeholder}
              aria-label={`${label} ${index + 1}`}
              onChange={(event) => set(lines.map((item, position) => (position === index ? event.target.value : item)))}
            />
            <span className="sf-cms-line-actions">
              <button
                type="button"
                aria-label={`Move ${label.toLowerCase()} ${index + 1} up`}
                disabled={index === 0}
                onClick={() => {
                  const next = [...lines];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  set(next);
                }}
              >
                <Icon name="chevron-up" size={14} />
              </button>
              <button
                type="button"
                aria-label={`Move ${label.toLowerCase()} ${index + 1} down`}
                disabled={index === lines.length - 1}
                onClick={() => {
                  const next = [...lines];
                  [next[index + 1], next[index]] = [next[index], next[index + 1]];
                  set(next);
                }}
              >
                <Icon name="chevron-down" size={14} />
              </button>
              <button type="button" aria-label={`Remove ${label.toLowerCase()} ${index + 1}`} onClick={() => set(lines.filter((_, position) => position !== index))}>
                <Icon name="x" size={14} />
              </button>
            </span>
          </li>
        ))}
      </ol>
      <button type="button" className="sf-cms-add-line" onClick={() => set([...lines, ""])}>
        <Icon name="plus" size={14} /> {addLabel}
      </button>
    </div>
  );
}

/** The bar every form ends with: the main action, a way out, and the result in words. */
export function SaveBar({ children, status }: { children: ReactNode; status?: { tone: "error" | "ok"; text: string } | null }) {
  return (
    <div className="sf-cms-savebar">
      {status ? (
        <p className={status.tone === "error" ? "sf-cms-status is-error" : "sf-cms-status"} role={status.tone === "error" ? "alert" : "status"}>
          {status.text}
        </p>
      ) : (
        <span />
      )}
      <div className="sf-cms-savebar-actions">{children}</div>
    </div>
  );
}
