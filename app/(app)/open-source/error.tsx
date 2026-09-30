"use client";

import { RecoverableError } from "@/components/feedback/RecoverableError";

export default function OpenSourceError({
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
      homeHref="/open-source"
      documentTitle="Something went wrong | SkillFlow"
    />
  );
}
