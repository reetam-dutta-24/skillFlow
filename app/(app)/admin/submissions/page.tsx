import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminQueue } from "@/lib/data/admin";
import { AdminSectionNav } from "../_components/AdminSectionNav";
import { AdminQueue } from "./_components/AdminQueue";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Submissions" };
}

export default async function AdminSubmissionsPage() {
  await requireAdmin();
  const items = await getAdminQueue();
  return (
    <div className="sf-admin-page">
      <header className="sf-page-head">
        <AdminSectionNav current="submissions" />
        <h1>Submissions</h1>
        <p>Review suggested resources before they can appear on a roadmap.</p>
      </header>
      <AdminQueue initial={items} />
    </div>
  );
}
