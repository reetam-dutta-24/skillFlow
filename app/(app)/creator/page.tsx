import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreatorDesk } from "./_components/CreatorDesk";

export const metadata: Metadata = { title: "Creator" };

export default async function CreatorPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { status } = await searchParams;
  const initial = status === "pending" || status === "verified" ? status : "none";
  return (
    <div className="sf-v2">
      <p className="sf-v2-label">Version 2 preview</p>
      <header className="sf-page-head">
        <h1>Creator</h1>
        <p>Apply to contribute lessons. Verification is a review, not a view count.</p>
      </header>
      <CreatorDesk initial={initial} />
    </div>
  );
}
