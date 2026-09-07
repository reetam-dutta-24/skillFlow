import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";

// Root not-found — catches both a bare notFound() with no closer boundary
// and any URL that doesn't match a route at all (Next's default is an
// unstyled generic page; this replaces it with the design system).
// Kept independent of AppShell on purpose, same reasoning as app/error.tsx.
export default function NotFound() {
  return (
    <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg-app)" }}>
      <EmptyState
        icon="compass"
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
        action={
          <Link href="/" className="sf-link-btn sf-link-btn-gradient" style={{ height: 40, padding: "0 20px", borderRadius: "var(--radius-btn)", fontSize: "var(--text-sm)" }}>
            Go home
          </Link>
        }
        style={{ maxWidth: 420 }}
      />
    </div>
  );
}
