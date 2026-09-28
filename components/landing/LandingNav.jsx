"use client";

import { useState } from "react";
import { ThemeToggle } from "../forms/ThemeToggle.jsx";
import { Icon } from "../core/Icon.jsx";
import { CtaLink } from "./CtaLink.jsx";

/** Landing bar. Light and dark sit with the account actions. Accent choice is not on this page. */
export function LandingNav({ wordmark, links, primaryCta, secondaryCta, defaultTheme }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sf-nav">
      <div className="sf-nav-inner">
        <a className="sf-wordmark" href="#welcome">
          {wordmark}
        </a>
        <nav id="landing-menu" className={open ? "sf-nav-panel is-open" : "sf-nav-panel"} aria-label="On this page">
          <ul className="sf-nav-links">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sf-nav-actions">
          <ThemeToggle defaultTheme={defaultTheme} quiet />
          <CtaLink href={secondaryCta.href} variant="outline" size="sm">
            {secondaryCta.label}
          </CtaLink>
          <CtaLink href={primaryCta.href} size="sm">
            {primaryCta.label}
          </CtaLink>
        </div>
        <button
          type="button"
          className="sf-nav-toggle"
          aria-expanded={open}
          aria-controls="landing-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? "x" : "menu"} size={18} />
          {open ? "Close" : "Menu"}
        </button>
      </div>
    </header>
  );
}
