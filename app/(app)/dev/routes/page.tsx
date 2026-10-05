import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Routes" };

const ROUTES = [
  ["/", "Landing"],
  ["/login", "Login"],
  ["/signup", "Signup"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/onboarding", "Onboarding"],
  ["/dashboard", "Home"],
  ["/clips", "Clips"],
  ["/roadmap", "Roadmaps"],
  ["/skills", "Niches"],
  ["/roadmap/full-stack-web-dev", "Roadmap detail"],
  ["/lesson/stage_fs_2", "Lesson"],
  ["/milestone/__explain_input__", "Explain-back preview"],
  ["/progress", "Progress"],
  ["/analytics", "Analytics"],
  ["/submit", "Submit a resource"],
  ["/submit/byor", "Bring your own resource"],
  ["/settings", "Settings"],
  ["/admin/submissions", "Admin submissions"],
  ["/admin/catalog", "Admin catalog"],
  ["/upgrade", "Upgrade"],
  ["/upgrade?plan=premium", "Manage subscription"],
  ["/notes", "Notes"],
  ["/creator", "Creator studio"],
  ["/creator/new", "Upload a video"],
  ["/admin/creator", "Creator review"],
  ["/transcript/me/full-stack-web-dev", "Transcript"],
  ["/dev/error", "App error"],
  ["/dev/missing", "App not found"],
  ["/dev/root-error", "Root error"],
  ["/dev/root-missing", "Root not found"],
] as const;

export default function DevRoutesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="sf-v2">
      <header className="sf-page-head">
        <h1>Routes</h1>
        <p>Every current screen. This page is hidden in production.</p>
      </header>
      <ul className="sf-route-list">
        {ROUTES.map(([href, label]) => (
          <li key={href}><Link href={href}>{label}</Link><span>{href}</span></li>
        ))}
      </ul>
    </div>
  );
}
