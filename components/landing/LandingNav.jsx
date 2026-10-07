"use client";

import { useState } from "react";
import { ThemeToggle } from "../forms/ThemeToggle.jsx";
import { Icon } from "../core/Icon.jsx";
import { CtaLink } from "./CtaLink.jsx";

/** Sticky landing bar. Accent choice is not on this page. */
export function LandingNav({ wordmark, links, loginCta, startCta }) {
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
            <li className="sf-nav-phone-only">
              <a href={loginCta.href}>{loginCta.label}</a>
            </li>
            <li className="sf-nav-phone-only sf-nav-theme">
              <ThemeToggle quiet />
            </li>
          </ul>
        </nav>
        <div className="sf-nav-actions">
          {/* On a phone these two move into the menu, so the bar stays one calm row. */}
          <span className="sf-nav-wide-only">
            <ThemeToggle quiet />
            <CtaLink href={loginCta.href} variant="ghost" size="sm">
              {loginCta.label}
            </CtaLink>
          </span>
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
