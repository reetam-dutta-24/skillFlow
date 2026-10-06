import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PracticeForm } from "./_components/PracticeForm";

export const metadata: Metadata = { title: "Practice · Notes" };

export default async function PracticePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rows = await prisma.skill.findMany({
    where: { status: "AVAILABLE", stages: { some: {} } },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      order: true,
      userProgress: { where: { userId: session.user.id }, select: { id: true } },
    },
  });
  const skills = [...rows]
    .sort((a, b) => Number(b.userProgress.length > 0) - Number(a.userProgress.length > 0) || a.order - b.order)
    .map((skill) => ({ id: skill.id, name: skill.name }));

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
