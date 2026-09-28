"use client";

import { RecoverableError } from "@/components/feedback/RecoverableError";

export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RecoverableError error={error} retry={retry} />;
}
