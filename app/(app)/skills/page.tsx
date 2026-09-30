import type { Metadata } from "next";
import { Suspense } from "react";
import { FollowedSkillSeed } from "./_components/FollowedSkillSeed";
import { NicheGrid } from "./_components/NicheGrid";
import { FollowedOverrideProvider } from "./_components/SkillBrowse";

export const metadata: Metadata = { title: "Niches" };

export default function SkillsPage() {
  return (
    <FollowedOverrideProvider>
      <div className="sf-browse">
        <header className="sf-page-head">
          <h1>Niches</h1>
          <p>Every skill on SkillFlow. Filter a group, or search a name, a topic, or a tag.</p>
        </header>
        <NicheGrid />
        <Suspense fallback={null}>
          <FollowedSkillSeed />
        </Suspense>
      </div>
    </FollowedOverrideProvider>
  );
}
