import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Placeholder for the SkillFlow privacy policy.",
};

export default function PrivacyPage() {
  return (
    <main className="sf-legal">
      <h1>Privacy Policy</h1>
      <p>This page is a placeholder. The privacy policy will be published here.</p>
      <a href="/">Back to SkillFlow</a>
    </main>
  );
}
