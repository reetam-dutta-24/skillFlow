import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadDetoxState } from "@/lib/data/detox";
import { DetoxCheckRunner } from "./_components/DetoxCheckRunner";

export const metadata: Metadata = { title: "Detox self-check" };

export default function DetoxCheckPage() {
  return (
    <Suspense fallback={<p className="sf-review-live">Loading the self-check</p>}>
      <DetoxCheckContent />
    </Suspense>
  );
}

/** Personal: saved answers are read on the request. A finished check goes to the Detox page. */
async function DetoxCheckContent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const state = await loadDetoxState(session.user.id);
  if (state.status === "complete") redirect("/detox");
  return (
    <DetoxCheckRunner
      initialAnswers={state.status === "in-progress" ? state.answers : {}}
      startAt={state.status === "in-progress" ? state.firstOpen : 0}
      started={state.status === "in-progress"}
    />
  );
}
