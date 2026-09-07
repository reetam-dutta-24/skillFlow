"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/ErrorState.jsx";

// Root runtime-error boundary. Must be a Client Component (Next.js
// requirement — error boundaries are React error boundaries under the
// hood). Kept deliberately simple and independent of AppShell: if
// something broke badly enough to reach here, depending on the same shell
// that might be implicated isn't the safe move.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg-app)" }}>
      <ErrorState
        title="Something went wrong"
        description="An unexpected error occurred. You can try again, or head back to the dashboard."
        detail={error.digest ? `Error ref: ${error.digest}` : undefined}
        onRetry={retry}
        style={{ maxWidth: 420 }}
      />
    </div>
  );
}
