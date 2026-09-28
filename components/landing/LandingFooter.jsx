/** Landing footer. Section links repeat the navbar; account links repeat the auth actions. */
export function LandingFooter({ wordmark, blurb, links, primaryCta, secondaryCta }) {
  return (
    <footer className="sf-footer">
      <div className="sf-footer-inner">
        <div>
          <p className="sf-wordmark">{wordmark}</p>
          <p className="sf-footer-blurb">{blurb}</p>
        </div>
        <nav aria-label="Footer">
          <p className="sf-kicker">On this page</p>
          <ul className="sf-footer-links">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="sf-kicker">Account</p>
          <ul className="sf-footer-links">
            <li>
              <a href={secondaryCta.href}>{secondaryCta.label}</a>
            </li>
            <li>
              <a href={primaryCta.href}>{primaryCta.label}</a>
            </li>
          </ul>
        </nav>
        <p className="sf-footer-meta">© 2026 SkillFlow</p>
      </div>
    </footer>
  );
}
