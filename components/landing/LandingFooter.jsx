import { ThemeToggle } from "../forms/ThemeToggle.jsx";

function isLiveHref(href) {
  return href.startsWith("/") || href.startsWith("#") || href.startsWith("http");
}

/** Brand, four link columns, and a bar with the credit and theme control. */
export function LandingFooter({ wordmark, blurb, columns, credit }) {
  return (
    <footer className="sf-footer">
      <div className="sf-footer-inner">
        <div className="sf-footer-brand">
          <p className="sf-wordmark">{wordmark}</p>
          <p className="sf-footer-blurb">{blurb}</p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="sf-kicker">{column.title}</p>
            <ul className="sf-footer-links">
              {column.links.map((link) => (
                <li key={link.label}>
                  {isLiveHref(link.href) ? (
                    <a href={link.href}>{link.label}</a>
                  ) : (
                    <span className="sf-footer-placeholder">
                      {link.label} · {link.href}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="sf-footer-bar">
        <p>
          © 2026 SkillFlow. {credit}
        </p>
        <ThemeToggle quiet />
      </div>
    </footer>
  );
}
