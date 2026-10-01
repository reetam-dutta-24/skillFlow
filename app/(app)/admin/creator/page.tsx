import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-admin";
import { listCreatorQueue } from "@/lib/data/creator";
import { AdminSectionNav } from "../_components/AdminSectionNav";
import { CreatorQueue } from "./_components/CreatorQueue";

export const metadata: Metadata = { title: "Creator review" };

export default async function AdminCreatorPage() {
  await requireAdmin();
  const items = await listCreatorQueue();
  return (
    <div className="sf-admin-page">
      <header className="sf-page-head">
        <AdminSectionNav current="creator" />
        <h1>Creator videos</h1>
        <p>Approve a video to place it on that niche’s clip feed. Reject it with a note the creator can read.</p>
      </header>
      <CreatorQueue items={items} />
    </div>
  );
}
