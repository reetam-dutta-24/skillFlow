import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { auth } from "@/lib/auth";
import { listCreatorSkills } from "@/lib/data/creator";
import { StudioEditor } from "../_components/StudioEditor";

export const metadata: Metadata = { title: "Upload a video" };

export default async function NewCreatorWorkPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const skills = await listCreatorSkills();

  return (
    <div className="sf-creator-page">
      <header className="sf-page-head">
        <p>
          <Link href="/creator">Creator studio</Link>
        </p>
        <h1>Upload a video</h1>
        <p>Pick one niche. Learners only see it in that niche after an admin approves it.</p>
      </header>
      {skills.length === 0 ? (
        <EmptyState icon="video" title="No open niche yet" description="Videos can be uploaded once a niche is available." />
      ) : (
        <StudioEditor skills={skills} work={null} />
      )}
    </div>
  );
}
