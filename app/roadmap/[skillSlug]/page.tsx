import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoadmapView } from "./roadmap-view";
import { getSkillBySlug } from "@/lib/mock-data";

type Params = Promise<{ skillSlug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { skillSlug } = await params;
  const skill = getSkillBySlug(skillSlug);
  return {
    title: skill ? `${skill.name} · Roadmap` : "Roadmap",
    description: skill?.description,
    robots: { index: false, follow: false },
  };
}

export default async function RoadmapPage({ params }: { params: Params }) {
  const { skillSlug } = await params;
  if (!getSkillBySlug(skillSlug)) notFound();

  return <RoadmapView skillSlug={skillSlug} />;
}
