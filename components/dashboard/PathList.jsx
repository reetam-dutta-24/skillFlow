"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "../core/Icon.jsx";

const EASE = [0.22, 1, 0.36, 1];

/** Full skill path. Open stages link in. Later stages stay locked. */
export function PathList({ stages }) {
  const reduce = useReducedMotion();

  return (
    <ol className="sf-path">
      {stages.map((stage, index) => (
        <motion.li
          key={stage.order}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.35, delay: index * 0.05, ease: EASE }}
        >
          {stage.open ? (
            <Link className="sf-path-card" href={`/dashboard/path/${stage.order}`}>
              <StageBody stage={stage} />
              <Icon name="chevron-right" size={18} />
            </Link>
          ) : (
            <div className="sf-path-card is-locked">
              <StageBody stage={stage} />
              <Icon name="lock" size={16} />
            </div>
          )}
        </motion.li>
      ))}
    </ol>
  );
}

function StageBody({ stage }) {
  return (
    <>
      <span className="sf-path-index">{String(stage.order).padStart(2, "0")}</span>
      <span className="sf-path-copy">
        <span className="sf-path-state">{stage.open ? "Open" : "Locked"}</span>
        <span className="sf-path-title">{stage.title}</span>
        {stage.description ? <span className="sf-path-desc">{stage.description}</span> : null}
        {stage.open ? null : <span className="sf-path-hint">Finish the stage before this.</span>}
      </span>
    </>
  );
}
