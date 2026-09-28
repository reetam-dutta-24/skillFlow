"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/feedback/ErrorState.jsx";

export function QuizFailure() {
  const router = useRouter();
  return (
    <ErrorState
      titleAs="h1"
      title="This quiz did not generate"
      description="The questions for this stage did not come back. You can try again."
      onRetry={() => router.refresh()}
    />
  );
}
