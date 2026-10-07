import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadPathRecord } from "@/lib/records/load";

type PageProps = { params: Promise<{ userId: string; skillSlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { skillSlug } = await params;
  return {
    title: `${skillSlug} certificate`,
    robots: { index: false, follow: false },
  };
}

export default async function CertificatePage({ params }: PageProps) {
  const session = await auth();
  const { userId, skillSlug } = await params;
  const data = await loadPathRecord(userId, skillSlug, session?.user?.id);
  if (!data?.complete) notFound();

  return (
    <main className="sf-certificate">
      <article className="sf-certificate-sheet">
        <header className="sf-certificate-head">
          <p className="sf-certificate-mark">SkillFlow</p>
          <h1>Certificate of completion</h1>
          <span className="sf-certificate-rule" aria-hidden="true" />
        </header>
        <p className="sf-certificate-line">This records that</p>
        <p className="sf-certificate-name">{data.learnerName}</p>
        <p className="sf-certificate-line">passed every explain-back on</p>
        <p className="sf-certificate-name sf-certificate-path">{data.skillName}</p>
        <p className="sf-certificate-issued">{data.issuedOn ? `Issued ${data.issuedOn}` : "Issued by SkillFlow"}</p>
        <section className="sf-certificate-record" aria-labelledby="certificate-stages">
          <h2 id="certificate-stages">Stages · {data.stages.length}</h2>
          <ol className="sf-certificate-stages">
            {data.stages.map((stage) => (
              <li key={stage.order}>
                <span className="sf-certificate-num" aria-hidden="true">{stage.order}</span>
                <span className="sf-certificate-title">
                  <span className="sf-sr">Stage {stage.order}. </span>
                  {stage.title}
                </span>
                <span className="sf-certificate-when">{stage.when}</span>
              </li>
            ))}
          </ol>
        </section>
        <p className="sf-certificate-copy">
          Copyright SkillFlow. This record is issued by SkillFlow. It covers explain-back passes on this path. It is not a license or a degree.
        </p>
      </article>
      <p className="sf-record-actions">
        <a className="sf-btn sf-btn--gradient sf-btn--md" href={`/certificate/${data.userId}/${data.skillSlug}/pdf`}>Download PDF</a>
        <Link className="sf-btn sf-btn--outline sf-btn--md" href={session?.user?.id ? "/progress" : "/"}>Back to SkillFlow</Link>
      </p>
    </main>
  );
}
