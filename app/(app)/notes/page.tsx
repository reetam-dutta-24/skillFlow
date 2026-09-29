import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getNotes } from "@/lib/data/v2";
import { NotesDesk } from "./_components/NotesDesk";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const notes = await getNotes();
  return (
    <div className="sf-v2">
      <p className="sf-v2-label">Version 2 preview</p>
      <header className="sf-page-head">
        <h1>Notes</h1>
        <p>Search what you wrote, then keep the note or ask for a short restatement.</p>
      </header>
      <NotesDesk notes={notes} />
    </div>
  );
}
