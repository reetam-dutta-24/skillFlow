/** Landing footer. Page links, account links, and the three niches. */
export function LandingFooter({ wordmark, blurb, links, primaryCta, secondaryCta, skills }) {
  return (
    <footer className="sf-footer">
      <div className="sf-footer-inner">
        <div className="sf-footer-brand">
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
        <nav aria-label="Niches">
          <p className="sf-kicker">Niches</p>
          <ul className="sf-footer-links">
            {skills.map((skill) => (
              <li key={skill}>
                <a href="#about">{skill}</a>
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
      </div>
      <div className="sf-footer-bar">
        <p>© 2026 SkillFlow</p>
        <p>Mastery-first roadmaps. A quiz, then an explain-back, before the next stage.</p>
      </div>
    </footer>
  );
}
