import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { auth } from "@/lib/auth";
import { listStudioWorks } from "@/lib/data/creator";

export const metadata: Metadata = { title: "Creator studio" };

const STATUS = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PENDING: { label: "In review", tone: "warn" },
  LIVE: { label: "On the feed", tone: "pass" },
  REJECTED: { label: "Needs a change", tone: "fail" },
} as const;

export default async function CreatorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const works = await listStudioWorks(session.user.id);

  return (
    <div className="sf-creator-page">
      <header className="sf-page-head">
        <h1>Creator studio</h1>
        <p>Upload a video you own. After review it joins that niche’s clip feed and your public profile.</p>
        <Link className="sf-creator-primary" href="/creator/new">
          Upload a video
        </Link>
      </header>
      {works.length === 0 ? (
        <EmptyState
          icon="video"
          titleAs="h2"
          title="Your library is empty"
          description="A draft stays here until you send it for review. Live videos are the ones learners can watch."
        />
      ) : (
        <ul className="sf-creator-grid">
          {works.map((work) => {
            const status = STATUS[work.status];
            return (
              <li key={work.id}>
                <article className="sf-creator-card">
                  <Chip tone={status.tone}>{status.label}</Chip>
                  <h2>
                    <Link href={`/creator/${work.id}`}>{work.title}</Link>
                  </h2>
                  <p>
                    {work.skillName} · {work.format === "short" ? "Short clip" : "Video"}
                  </p>
                  <p>
                    {work.views} {work.views === 1 ? "view" : "views"}
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
