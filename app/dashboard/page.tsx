import type { Metadata } from "next";
import { DashboardView } from "./dashboard-view";

// Static metadata requires a Server Component export, so the interactive
// body lives in dashboard-view.tsx and this file just wraps it.
// noindex: this is a signed-in app screen, not public marketing content.
export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your streak, in-progress skills, and next lesson at a glance.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardView />;
}
