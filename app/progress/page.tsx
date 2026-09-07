import type { Metadata } from "next";
import { ProgressView } from "./progress-view";

export const metadata: Metadata = {
  title: "Progress",
  description: "Mastery by skill, growth over time, and weak topics to review.",
  robots: { index: false, follow: false },
};

export default function ProgressPage() {
  return <ProgressView />;
}
