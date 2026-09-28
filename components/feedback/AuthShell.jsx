import { ThemeToggle } from "../forms/ThemeToggle.jsx";
import { AuthNicheCarousel } from "./AuthNicheCarousel.jsx";

/** Split auth layout. Copy and the skill carousel sit on the left, the form on the right. */
export function AuthShell({ headline, sub, brand = "SkillFlow", children }) {
  return (
    <div className="sf-auth">
      <aside className="sf-auth-aside">
        <div className="sf-auth-wash" aria-hidden="true" />
        <div className="sf-auth-stage">
          <div className="sf-auth-copy">
            <a className="sf-wordmark" href="/">
              {brand}
            </a>
            <h1>{headline}</h1>
            {sub ? <p className="sf-auth-sub">{sub}</p> : null}
          </div>
          <AuthNicheCarousel />
        </div>
      </aside>
      <div className="sf-auth-main">
        <div className="sf-auth-bar">
          <ThemeToggle quiet />
        </div>
        <div className="sf-auth-card">{children}</div>
      </div>
    </div>
  );
}
