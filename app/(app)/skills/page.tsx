import type { Metadata } from "next";
import { FollowedNicheFrame } from "./_components/FollowedNicheFrame";
import { NicheGrid } from "./_components/NicheGrid";

export const metadata: Metadata = { title: "Niches" };

export default function SkillsPage() {
  return (
    <FollowedNicheFrame>
      <div className="sf-browse">
        <header className="sf-page-head">
          <h1>Niches</h1>
          <p>Every skill on SkillFlow. Follow a path from its card. Filter a group, or search a name, a topic, or a tag.</p>
        </header>
        <NicheGrid />
      </div>
    </FollowedNicheFrame>
  );
}
