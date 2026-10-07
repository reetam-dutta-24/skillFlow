"use client";

import React from "react";

/**
 * The one button. Visual states (hover, pressed, focus, disabled, pending) live in CSS under `.sf-btn`
 * in app/globals.css, so they behave the same everywhere and need no JavaScript.
 * `pending` keeps the width, shows a spinner, and tells assistive tech the action is running.
 */
export function Button({
  variant = "outline",
  size = "md",
  full = false,
  pill = false,
  disabled = false,
  pending = false,
  pendingLabel,
  className,
  type = "button",
  children,
  ...rest
}) {
  const classes = [
    "sf-btn",
    `sf-btn--${variant}`,
    `sf-btn--${size}`,
    pill ? "sf-btn--pill" : "",
    full ? "sf-btn--full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={disabled || pending} aria-busy={pending || undefined} {...rest}>
      {pending ? <span className="sf-btn-spinner" aria-hidden="true" /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
