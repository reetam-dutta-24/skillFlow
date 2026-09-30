import type { Metadata } from "next";
import { loadPublicCatalog, publicStageTitle } from "@/lib/data/public-catalog";
import { CachedLesson } from "./_components/CachedLesson";

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
  const { stageId } = await params;
  return <CachedLesson stageId={stageId} />;
}
