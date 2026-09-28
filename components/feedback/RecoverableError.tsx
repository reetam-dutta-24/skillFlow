"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ErrorState } from "./ErrorState.jsx";

function detailFor(error: Error & { digest?: string }) {
  if (process.env.NODE_ENV !== "development") {
    return error.digest ? `Reference ${error.digest}` : undefined;
  }
  const reference = error.digest ? `Reference ${error.digest}` : "";
  return [error.message, reference].filter(Boolean).join(" · ") || undefined;
}

export function RecoverableError({
  error,
  retry,
  placement = "screen",
  homeHref = "/",
  documentTitle = "Something went wrong · SkillFlow",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  placement?: "screen" | "content";
  homeHref?: string;
  documentTitle?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = documentTitle;
    console.error(error);
    panelRef.current?.focus();
  }, [documentTitle, error]);

  return (
    <div className={placement === "content" ? "sf-boundary-inset" : "sf-boundary"}>
      <div ref={panelRef} className="sf-boundary-card" tabIndex={-1} role="alert">
        <ErrorState
          titleAs="h1"
          title="This page didn't load"
          description="Something unexpected happened. You can try again."
          onRetry={retry}
          detail={detailFor(error)}
        />
        <p className="sf-boundary-home">
          <Link className="sf-boundary-link" href={homeHref}>
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
