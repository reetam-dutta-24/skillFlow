import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonView } from "./lesson-view";
import { getStageById, getSkillForStage } from "@/lib/mock-data";

type Params = Promise<{ stageId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { stageId } = await params;
  const stage = getStageById(stageId);
  return {
    title: stage ? stage.lesson.title : "Lesson",
    description: stage?.description,
    robots: { index: false, follow: false },
  };
}

export default async function LessonPage({ params }: { params: Params }) {
  const { stageId } = await params;
  if (!getStageById(stageId) || !getSkillForStage(stageId)) notFound();

  return <LessonView stageId={stageId} />;
}
