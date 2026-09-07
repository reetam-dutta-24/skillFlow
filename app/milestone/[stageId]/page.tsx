import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MilestoneView } from "./milestone-view";
import { getStageById, getSkillForStage } from "@/lib/mock-data";

type Params = Promise<{ stageId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { stageId } = await params;
  const stage = getStageById(stageId);
  return {
    title: stage ? `Milestone · ${stage.title}` : "Milestone",
    robots: { index: false, follow: false },
  };
}

export default async function MilestonePage({ params }: { params: Params }) {
  const { stageId } = await params;
  if (!getStageById(stageId) || !getSkillForStage(stageId)) notFound();

  return <MilestoneView stageId={stageId} />;
}
