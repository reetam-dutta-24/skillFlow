import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Placeholder for the SkillFlow terms of service.",
};

export default function TermsPage() {
  return (
    <main className="sf-legal">
      <h1>Terms of Service</h1>
      <p>This page is a placeholder. The terms of service will be published here.</p>
      <a href="/">Back to SkillFlow</a>
    </main>
  );
}
