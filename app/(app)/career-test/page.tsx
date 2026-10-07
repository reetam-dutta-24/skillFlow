import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadCareerState } from "@/lib/data/career";
import { CareerTestRunner } from "./_components/CareerTestRunner";

export const metadata: Metadata = { title: "Career-fit test" };

export default function CareerTestPage() {
  return (
    <Suspense fallback={<p className="sf-review-live">Loading the test</p>}>
      <CareerTestContent />
    </Suspense>
  );
}

/** Personal: the saved answers are read on the request. */
async function CareerTestContent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const state = await loadCareerState(session.user.id);
  if (state.status === "complete") redirect("/career-test/report");
  return (
    <CareerTestRunner
      initialAnswers={state.status === "in-progress" ? state.answers : { ipip: {}, onet: {} }}
      startPage={state.status === "in-progress" ? state.firstOpenPage : 0}
      started={state.status === "in-progress"}
    />
  );
}
