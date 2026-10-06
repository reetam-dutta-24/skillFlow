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
        <h1>{data.skillName}</h1>
        <p>
          {data.learnerName}. {data.passedCount} of {data.stageCount} stages passed. This page is not indexed.
        </p>
      </header>
      <ul className="sf-transcript">
        {passed.length > 0 ? passed.map((stage) => (
          <li key={stage.order}>
            <strong>Stage {stage.order}. {stage.title}</strong>
            <span>{stage.when}</span>
          </li>
        )) : <li>No stage on this path has a passed explain-back yet.</li>}
      </ul>
      <p><a href={`/transcript/${data.userId}/${data.skillSlug}/pdf`}>Download PDF</a></p>
      <p><Link href={session?.user?.id ? "/progress" : "/"}>Back to SkillFlow</Link></p>
    </main>
  );
}
