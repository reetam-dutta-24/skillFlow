import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ByorForm } from "./_components/ByorForm";

export const metadata: Metadata = { title: "Bring your own resource" };

export default async function ByorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return (
    <div className="sf-v2">
      <p className="sf-v2-label">Version 2 preview</p>
      <header className="sf-page-head">
        <h1>Bring your own resource</h1>
        <p>Paste a lesson link. A quiz preview is generated here. Nothing is published to a roadmap.</p>
      </header>
      <ByorForm />
    </div>
  );
}
