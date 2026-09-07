"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "./AppShell";
import { EmptyState } from "../feedback/EmptyState.jsx";
import { Button } from "../core/Button.jsx";

export interface RouteNotFoundProps {
  pageTitle: string;
  title: string;
  description: string;
}

// Rendered by each dynamic route's not-found.tsx when notFound() is thrown
// server-side for a genuinely missing id/slug — a real 404, not a 200 that
// just looks empty. Kept as a Client Component (not-found files default to
// Server, but nothing requires that) so it can reuse AppShell/useRouter the
// same way the rest of the app does.
export function RouteNotFound({ pageTitle, title, description }: RouteNotFoundProps) {
  const router = useRouter();
  return (
    <AppShell title={pageTitle} active="roadmaps">
      <EmptyState
        icon="compass"
        title={title}
        description={description}
        action={<Button variant="outline" onClick={() => router.push("/dashboard")}>Back to dashboard</Button>}
      />
    </AppShell>
  );
}
