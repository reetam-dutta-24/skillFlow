import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadCatalog } from "@/lib/data/catalog";
import { SkillBrowse } from "./_components/SkillBrowse";

export const metadata: Metadata = { title: "Niches" };

export default async function SkillsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const catalog = await loadCatalog();
  const skills = catalog.map((entry) => ({
    id: entry.skill.id,
    name: entry.skill.name,
    description: entry.skill.description ?? "",
    status: entry.skill.status,
    followed: entry.skill.followed,
    stageCount: entry.stages.length,
    image: entry.skill.image,
    href: entry.skill.status === "available" && entry.stages.length > 0 ? `/roadmap/${entry.skill.slug}` : null,
  }));

  return (
    <div className="sf-browse">
      <header className="sf-page-head">
        <h1>Niches</h1>
        <p>Every skill on SkillFlow. Search a name or a topic, then open a path that is ready.</p>
      </header>
      <SkillBrowse skills={skills} />
    </div>
  );
}
