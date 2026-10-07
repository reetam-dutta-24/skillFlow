import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadPathRecord } from "@/lib/records/load";

type PageProps = { params: Promise<{ userId: string; skillSlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId, skillSlug } = await params;
  if (userId === "me") return { title: "Transcript", robots: { index: false, follow: false } };
  const data = await loadPathRecord(userId, skillSlug);
  return {
    title: data ? `${data.skillName} transcript` : "Page not found",
    robots: { index: false, follow: false },
  };
}

export default function TranscriptPage({ params }: PageProps) {
  return (
    <Suspense fallback={<p className="sf-review-live">Loading transcript</p>}>
      <TranscriptContent params={params} />
    </Suspense>
  );
}

async function TranscriptContent({ params }: PageProps) {
  const session = await auth();
  const { userId, skillSlug } = await params;
  const data = await loadPathRecord(userId, skillSlug, session?.user?.id);
  if (!data) notFound();
  const passed = data.stages.filter((stage) => stage.passed);

  return (
    <main className="sf-transcript-page">
      <header className="sf-page-head">
        <p className="sf-transcript-kicker">Transcript</p>
        <h1>{data.skillName}</h1>
        <p>
          {data.learnerName}. {data.passedCount} of {data.stageCount} stages passed. This page is not indexed.
        </p>
        <div
          className="sf-transcript-meter"
          role="progressbar"
          aria-label="Stages passed"
          aria-valuemin={0}
          aria-valuemax={data.stageCount}
          aria-valuenow={data.passedCount}
        >
          <span style={{ width: `${data.stageCount ? Math.round((data.passedCount / data.stageCount) * 100) : 0}%` }} />
        </div>
      </header>
      <ul className="sf-transcript">
        {passed.length > 0 ? passed.map((stage) => (
          <li key={stage.order}>
            <span className="sf-transcript-num" aria-hidden="true">{stage.order}</span>
            <strong><span className="sf-sr">Stage {stage.order}. </span>{stage.title}</strong>
            <span>{stage.when}</span>
          </li>
        )) : <li className="sf-transcript-empty">No stage on this path has a passed explain-back yet.</li>}
      </ul>
      <p className="sf-record-actions">
        <a className="sf-btn sf-btn--gradient sf-btn--md" href={`/transcript/${data.userId}/${data.skillSlug}/pdf`}>Download PDF</a>
        <Link className="sf-btn sf-btn--outline sf-btn--md" href={session?.user?.id ? "/progress" : "/"}>Back to SkillFlow</Link>
      </p>
    </main>
  );
}
