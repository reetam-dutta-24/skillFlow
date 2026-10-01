import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Chip } from "@/components/core/Chip.jsx";
import { auth } from "@/lib/auth";
import { getStudioWork, listCreatorSkills } from "@/lib/data/creator";
import { StudioEditor } from "../_components/StudioEditor";

export const metadata: Metadata = { title: "Your video" };

const STATUS = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PENDING: { label: "In review", tone: "warn" },
  LIVE: { label: "On the feed", tone: "pass" },
  REJECTED: { label: "Needs a change", tone: "fail" },
} as const;

function watchLabel(seconds: number) {
  if (seconds < 60) return `${seconds} sec`;
  return `${Math.round(seconds / 60)} min`;
}

export default async function CreatorWorkPage({ params }: { params: Promise<{ workId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { workId } = await params;
  const [work, skills] = await Promise.all([getStudioWork(session.user.id, workId), listCreatorSkills()]);
  if (!work) notFound();
  const status = STATUS[work.status];
  const average =
    work.views > 0 && work.durationSec > 0
      ? Math.min(100, Math.round((work.watchSec / (work.views * work.durationSec)) * 100))
      : null;

  return (
    <div className="sf-creator-page">
      <header className="sf-page-head">
        <p>
          <Link href="/creator">Creator studio</Link>
        </p>
        <h1>{work.title}</h1>
        <p>
          {work.skillName} · {work.format === "short" ? "Short clip" : "Video"}
        </p>
        <Chip tone={status.tone}>{status.label}</Chip>
      </header>
      <video className="sf-creator-preview" src={work.mediaUrl} controls playsInline preload="metadata" />
      <section className="sf-creator-stats" aria-label="This video">
        <div>
          <strong>{work.views}</strong>
          <span>{work.views === 1 ? "View" : "Views"}</span>
        </div>
        <div>
          <strong>{watchLabel(work.watchSec)}</strong>
          <span>Watch time</span>
        </div>
        <div>
          <strong>{work.finished}</strong>
          <span>Played most of the way through</span>
        </div>
        {average !== null ? (
          <div>
            <strong>{average}%</strong>
            <span>Average watched</span>
          </div>
        ) : null}
      </section>
      <p className="sf-creator-hint">These numbers stay in your studio. The clip feed does not show them.</p>
      {work.status === "LIVE" ? (
        <p>
          <Link href={`/profile/${session.user.id}`}>View public profile</Link>
        </p>
      ) : null}
      <StudioEditor skills={skills} work={work} />
    </div>
  );
}
