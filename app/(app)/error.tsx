"use client";

import { RecoverableError } from "@/components/feedback/RecoverableError";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <RecoverableError
      error={error}
      retry={retry}
      placement="content"
      homeHref="/dashboard"
      documentTitle="Something went wrong | SkillFlow"
    />
  );
}
