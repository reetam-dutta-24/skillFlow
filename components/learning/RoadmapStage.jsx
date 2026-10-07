"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "../core/Icon.jsx";
import { Chip } from "../core/Chip.jsx";
import { SkillImage } from "../core/SkillImage";

const STATUS = {
  done: { icon: "circle-check", color: "var(--state-pass)", chip: "pass", label: "Passed" },
  active: { icon: "circle-dot", color: "var(--accent)", chip: "accent", label: "In progress" },
  todo: { icon: "circle", color: "var(--text-faint)", chip: "neutral", label: "Available" },
  locked: { icon: "lock", color: "var(--state-lock)", chip: "lock", label: "Locked" },
};

/** One stage in a skill roadmap. A locked stage shows a lock. Only a concealed stage is blurred. */
export function RoadmapStage({ index, title, image, description, status = "todo", mastery, meta, unlockHint, conceal = false, last = false, href, onOpen, className, style, ...rest }) {
  const s = STATUS[status] || STATUS.todo;
  const locked = status === "locked";
  const veiled = locked && conceal;
  const open = Boolean(href) && !locked;
  const panel = (
    <>
      <div className="sf-stage-body" style={{ filter: veiled ? "var(--blur-lock)" : undefined, opacity: veiled ? 0.5 : undefined }}>
        <div className="sf-stage-copy">
          <div className="sf-stage-kicker">
            <span>Stage {index}</span>
            {mastery != null && !locked ? <Chip tone="accent">{mastery}% mastery</Chip> : null}
            {!veiled ? <Chip tone={s.chip}>{s.label}</Chip> : null}
          </div>
          <h3>{title}</h3>
          {description ? <p className="sf-stage-desc">{description}</p> : null}
          {locked && !veiled && unlockHint ? <p className="sf-stage-meta">{unlockHint}</p> : null}
          {meta ? <p className="sf-stage-meta">{meta}</p> : null}
        </div>
        {image ? (
          <span className="sf-stage-photo-wrap">
            <SkillImage className="sf-stage-photo" src={image} alt="" fill sizes="148px" />
          </span>
        ) : null}
      </div>
      {veiled ? (
        <div className="sf-stage-veil">
          <Icon name="lock" size={18} color="var(--state-lock)" />
          <p>{unlockHint}</p>
        </div>
      ) : null}
    </>
  );
  return (
    <li className={["sf-stage", className].filter(Boolean).join(" ")} data-status={status} data-last={last ? "true" : undefined} style={style} {...rest}>
      <div className="sf-stage-rail" aria-hidden="true">
        <span className="sf-stage-mark">
          <Icon name={s.icon} size={16} color={s.color} />
        </span>
        {!last ? <span className="sf-stage-line" /> : null}
      </div>
      {open ? (
        <Link href={href} className="sf-stage-panel sf-roadmap-open">
          {panel}
        </Link>
      ) : (
        <div className="sf-stage-panel" onClick={() => !locked && onOpen && onOpen()}>
          {panel}
        </div>
      )}
    </li>
  );
}
