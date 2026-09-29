import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSubmitCatalog } from "@/lib/data/submissions";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { SubmitForm } from "./_components/SubmitForm";
import { YourSubmissions } from "./_components/YourSubmissions";

export const metadata: Metadata = { title: "Submit a resource" };

export default async function SubmitPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const skills = await getSubmitCatalog();

  return (
    <div className="sf-submit-page">
      <header className="sf-page-head">
        <h1>Submit a resource</h1>
        <p>Suggest a lesson for a stage. It stays off the roadmap until an admin approves it.</p>
      </header>
      <Suspense>
        <SubmitForm skills={skills} />
      </Suspense>
      <section aria-labelledby="your-submissions">
        <h2 id="your-submissions">Your submissions</h2>
        <Suspense fallback={<Skeleton width="100%" height={120} radius="var(--radius-card)" />}>
          <YourSubmissions />
        </Suspense>
      </section>
    </div>
  );
}
