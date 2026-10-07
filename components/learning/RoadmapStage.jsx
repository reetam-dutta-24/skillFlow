"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "../core/Icon.jsx";
import { SkillImage } from "../core/SkillImage";

const STATUS = {
  done: { icon: "check", label: "Passed" },
  active: { icon: "arrow-right", label: "Up next" },
  todo: { icon: null, label: "Open" },
  locked: { icon: "lock", label: "Locked" },
};

/**
 * One stage on a path: a photo, the stage number on the rail, and the state in words as well as color.
 * The current stage is the one card with an accent edge and a "Start stage" cue.
 * A locked stage keeps its title and description readable and says what opens it.
 */
export function RoadmapStage({
  index,
  title,
  image,
  description,
  status = "todo",
  current = false,
  mastery,
  meta,
  unlockHint,
  ctaLabel,
  last = false,
  href,
  className,
  style,
  ...rest
}) {
  const s = STATUS[status] || STATUS.todo;
  const locked = status === "locked";
  const open = Boolean(href) && !locked;
  const cue = ctaLabel ?? (current ? "Start stage" : status === "done" ? "Review stage" : "Open stage");

  const card = (
    <>
      <div className="sf-stagecard-media">
        {image ? (
          <SkillImage className="sf-stagecard-photo" src={image} alt="" fill sizes="(max-width: 640px) 100vw, 300px" />
        ) : (
          <span className="sf-stagecard-placeholder" aria-hidden="true">
            <Icon name="route" size={28} />
          </span>
        )}
        <span className="sf-stagecard-num" aria-hidden="true">
          {index}
        </span>
        {locked ? (
          <span className="sf-stagecard-lock" aria-hidden="true">
            <Icon name="lock" size={18} />
          </span>
        ) : null}
      </div>
      <div className="sf-stagecard-body">
        <p className="sf-stagecard-kicker">
          <span>Stage {index}</span>
          <span className={`sf-stagecard-state is-${status}${current ? " is-current" : ""}`}>
            {s.icon ? <Icon name={s.icon} size={13} /> : null}
            {current ? "Up next" : s.label}
          </span>
          {mastery != null && !locked && status !== "done" ? <span className="sf-stagecard-state">{mastery}% mastery</span> : null}
        </p>
        <h3>{title}</h3>
        {description ? <p className="sf-stagecard-desc">{description}</p> : null}
        {locked && unlockHint ? (
          <p className="sf-stagecard-hint">
            <Icon name="lock" size={13} />
            {unlockHint}
          </p>
        ) : null}
        <div className="sf-stagecard-foot">
          {meta ? <p className="sf-stagecard-meta">{meta}</p> : <span />}
          {open ? (
            <span className={current ? "sf-stagecard-cue is-primary" : "sf-stagecard-cue"}>
              {cue}
              <Icon name="arrow-right" size={14} />
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <li
      className={["sf-stagecard", className].filter(Boolean).join(" ")}
      data-status={status}
      data-current={current ? "true" : undefined}
      style={style}
      {...rest}
    >
      <div className="sf-stagecard-rail" aria-hidden="true">
        <span className="sf-stagecard-dot">{status === "done" ? <Icon name="check" size={14} /> : locked ? <Icon name="lock" size={12} /> : index}</span>
        {!last ? <span className="sf-stagecard-line" /> : null}
      </div>
      {open ? (
        <Link href={href} className="sf-stagecard-panel" aria-label={`Stage ${index}: ${title}. ${current ? "Up next" : s.label}.`}>
          {card}
        </Link>
      ) : (
        <div className="sf-stagecard-panel" aria-disabled={locked || undefined}>
          {card}
        </div>
      )}
    </li>
  );
}
