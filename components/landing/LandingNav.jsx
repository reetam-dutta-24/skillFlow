"use client";

import { useState } from "react";
import { ThemeToggle } from "../forms/ThemeToggle.jsx";
import { Icon } from "../core/Icon.jsx";
import { CtaLink } from "./CtaLink.jsx";

/** Sticky landing bar. Accent choice is not on this page. */
export function LandingNav({ wordmark, links, loginCta, startCta, defaultTheme }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sf-nav">
      <div className="sf-nav-inner">
        <a className="sf-wordmark" href="#home">
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
          <CtaLink href={loginCta.href} variant="ghost" size="sm">
            {loginCta.label}
          </CtaLink>
          <CtaLink href={startCta.href} size="sm">
            {startCta.label}
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
