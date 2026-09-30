import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTranscript } from "@/lib/data/v2";
import { TranscriptPanel } from "./_components/TranscriptPanel";

type PageProps = { params: Promise<{ userId: string; skillSlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { skillSlug } = await params;
  const data = await getTranscript(skillSlug);
  return {
    title: data ? `${data.skill.name} transcript` : "Page not found",
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
  const data = await getTranscript(skillSlug);
  if (!data) notFound();
  const owner = Boolean(session?.user?.id && (session.user.id === userId || userId === "me"));

  return (
    <main className="sf-transcript-page">
      <p className="sf-v2-label">Version 2 preview</p>
      <header className="sf-page-head">
        <h1>{data.skill.name}</h1>
        <p>{owner ? "Your" : "A learner's"} verified milestones. This page is not indexed.</p>
      </header>
      <ul className="sf-transcript">
        {data.milestones.length ? data.milestones.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span>Quiz {item.quizPassedOn}</span>
            <span>Explain-back {item.explainBackPassedOn}</span>
          </li>
        )) : <li>No passed milestone on this skill yet.</li>}
      </ul>
      {owner ? <TranscriptPanel /> : null}
      <p><Link href={session?.user?.id ? "/dashboard" : "/"}>Back to SkillFlow</Link></p>
    </main>
  );
}
