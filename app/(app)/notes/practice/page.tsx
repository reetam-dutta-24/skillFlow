import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadFollowedSkillIds } from "@/lib/data/catalog";
import { loadPublicCatalog } from "@/lib/data/public-catalog";
import { PracticeForm } from "./_components/PracticeForm";

export const metadata: Metadata = { title: "Practice · Notes" };

export default async function PracticePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [catalog, followed] = await Promise.all([loadPublicCatalog(), loadFollowedSkillIds(session.user.id)]);
  const followedIds = new Set(followed);
  const skills = catalog
    .filter((entry) => entry.skill.status === "available" && entry.stages.length > 0)
    .sort(
      (a, b) =>
        Number(followedIds.has(b.skill.id)) - Number(followedIds.has(a.skill.id)) || a.skill.order - b.skill.order,
    )
    .map((entry) => ({ id: entry.skill.id, name: entry.skill.name }));

  return (
    <div className="sf-notes-page">
      <header className="sf-page-head">
        <h1>Practice</h1>
        <p>Start with a link to the page you are learning from. You can also drop a text file or paste a passage. The review uses the page text. A note that holds is saved here. It does not pass a stage.</p>
        <p className="sf-notes-actions">
          <Link href="/notes">Back to notes</Link>
        </p>
      </header>
      <PracticeForm skills={skills} />
    </div>
  );
}
