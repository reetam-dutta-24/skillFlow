"use client";

import { useState } from "react";
import { Icon } from "../core/Icon.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";

/** One question open at a time. Arrow keys move between questions. */
export function FaqSection({ title, items }) {
  const [open, setOpen] = useState(null);

  function moveFocus(index) {
    const next = (index + items.length) % items.length;
    document.getElementById(`faq-q-${next}`)?.focus();
  }

  function onKeyDown(event, index) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFocus(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveFocus(items.length - 1);
    }
  }

  return (
    <section id="faq" className="sf-section sf-band-sink" aria-labelledby="landing-faq-title">
      <SectionHeader
        align="center"
        className="sf-section-head"
        title={title}
        titleId="landing-faq-title"
        titleSize="var(--text-section)"
      />
      <div className="sf-faq">
        {items.map((item, index) => {
          const expanded = open === index;
          const buttonId = `faq-q-${index}`;
          const panelId = `faq-a-${index}`;
          return (
            <div key={item.question} className={expanded ? "sf-faq-item is-open" : "sf-faq-item"}>
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpen(expanded ? null : index)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                >
                  <span>{item.question}</span>
                  <Icon name={expanded ? "chevron-up" : "chevron-down"} size={18} />
                </button>
              </h3>
              <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!expanded}>
                <p>{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
