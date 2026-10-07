import type { ReactNode } from "react";
import Link from "next/link";
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED } from "@/lib/legal";

export type LegalSection = { id: string; title: string; body: ReactNode };

/**
 * A readable legal page: a short version first, a table of contents (sticky on desktop,
 * a disclosure on phones), numbered sections with anchors, and one way to get in touch.
 * Static content, the same for every visitor, so it prerenders with no cache tag.
 */
export function LegalDocument({
  title,
  lede,
  summary,
  sections,
  other,
}: {
  title: string;
  lede: string;
  summary: string[];
  sections: LegalSection[];
  other: { href: string; label: string };
}) {
  const toc = (
    <ol className="sf-doc-toc-list">
      {sections.map((section, index) => (
        <li key={section.id}>
          <a href={`#${section.id}`}>
            <span aria-hidden="true">{index + 1}</span>
            {section.title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="sf-doc-page">
      <header className="sf-doc-bar">
        <Link className="sf-doc-brand" href="/">
          SkillFlow
        </Link>
        <nav aria-label="Legal">
          <Link href={other.href}>{other.label}</Link>
        </nav>
      </header>
      <main className="sf-doc" id="main">
        <header className="sf-doc-head">
          <p className="sf-doc-kicker">Legal</p>
          <h1>{title}</h1>
          <p className="sf-doc-lede">{lede}</p>
          <p className="sf-doc-updated">Last updated {LEGAL_UPDATED}</p>
        </header>
        <aside className="sf-doc-summary" aria-labelledby="doc-summary">
          <h2 id="doc-summary">The short version</h2>
          <ul>
            {summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>The full text below is what counts.</p>
        </aside>
        <div className="sf-doc-grid">
          <nav className="sf-doc-toc" aria-label="On this page">
            <details className="sf-doc-toc-phone">
              <summary>On this page</summary>
              {toc}
            </details>
            <div className="sf-doc-toc-wide">
              <p>On this page</p>
              {toc}
            </div>
          </nav>
          <div className="sf-doc-body">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
                <h2 id={`${section.id}-title`}>
                  <span className="sf-doc-num" aria-hidden="true">
                    {index + 1}
                  </span>
                  {section.title}
                </h2>
                {section.body}
              </section>
            ))}
            <aside className="sf-doc-contact" aria-labelledby="doc-contact">
              <h2 id="doc-contact">Questions or requests</h2>
              <p>
                Write to <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>. Say which account the request is about,
                and send it from that account&apos;s email so we can confirm it is you.
              </p>
            </aside>
          </div>
        </div>
      </main>
      <footer className="sf-doc-foot">
        <p>© 2026 SkillFlow</p>
        <nav aria-label="Legal pages">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/">Back to SkillFlow</Link>
        </nav>
      </footer>
    </div>
  );
}
