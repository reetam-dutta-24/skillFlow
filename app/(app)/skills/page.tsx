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
          <p>Every niche on SkillFlow. Thirty paths are free, every stage included. Follow one from its card. A Premium niche opens once this account has Premium.</p>
        </header>
        <NicheGrid />
      </div>
    </FollowedNicheFrame>
  );
}
