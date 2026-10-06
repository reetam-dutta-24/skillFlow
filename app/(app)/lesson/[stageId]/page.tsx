import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadPublicCatalog, publicStageTitle } from "@/lib/data/public-catalog";
import { LessonView } from "./_components/CachedLesson";

type PageProps = {
  params: Promise<{ stageId: string }>;
};

export async function generateStaticParams() {
  const catalog = await loadPublicCatalog();
  return catalog.flatMap((entry) => entry.stages.map((stage) => ({ stageId: stage.id })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stageId } = await params;
  const title = await publicStageTitle(stageId);
  return { title: title ?? "Page not found" };
}

export default async function LessonPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { stageId } = await params;
  return <LessonView stageId={stageId} userId={session.user.id} />;
}
