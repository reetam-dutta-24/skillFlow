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
        <p className="sf-certificate-mark">SkillFlow</p>
        <h1>Certificate of completion</h1>
        <p>This records that</p>
        <p className="sf-certificate-name">{data.learnerName}</p>
        <p>passed every explain-back on</p>
        <p className="sf-certificate-name">{data.skillName}</p>
        <p>{data.issuedOn ? `Issued ${data.issuedOn}` : "Issued by SkillFlow"}</p>
        <h2>Stages</h2>
        <ol className="sf-certificate-stages">
          {data.stages.map((stage) => (
            <li key={stage.order}>
              <span>Stage {stage.order}. {stage.title}</span>
              <span>{stage.when}</span>
            </li>
          ))}
        </ol>
        <p className="sf-certificate-copy">
          Copyright SkillFlow. This record is issued by SkillFlow. It covers explain-back passes on this path. It is not a license or a degree.
        </p>
      </article>
      <p><a href={`/certificate/${data.userId}/${data.skillSlug}/pdf`}>Download PDF</a></p>
      <p><Link href={session?.user?.id ? "/progress" : "/"}>Back to SkillFlow</Link></p>
    </main>
  );
}
