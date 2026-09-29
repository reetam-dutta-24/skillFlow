import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectReview } from "@/lib/data/v2";
import { ProjectReview } from "./_components/ProjectReview";

export const metadata: Metadata = { title: "Project review" };

export default async function ProjectReviewPage({ params }: { params: Promise<{ stageId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { stageId } = await params;
  const data = await getProjectReview(stageId);
  return (
    <div className="sf-v2">
      <p className="sf-v2-label">Version 2 preview</p>
      <header className="sf-page-head">
        <h1>Project review</h1>
        <p>Submit your own project, or score a peer against the rubric. There is no freeform thread.</p>
      </header>
      <ProjectReview waiting={data.waiting} />
    </div>
  );
}
