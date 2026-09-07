import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizView } from "./quiz-view";
import { getStageById, getSkillForStage } from "@/lib/mock-data";

type Params = Promise<{ stageId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { stageId } = await params;
  const stage = getStageById(stageId);
  return {
    title: stage ? `Quiz · ${stage.title}` : "Quiz",
    robots: { index: false, follow: false },
  };
}

export default async function QuizPage({ params }: { params: Params }) {
  const { stageId } = await params;
  if (!getStageById(stageId) || !getSkillForStage(stageId)) notFound();

  return <QuizView stageId={stageId} />;
}
