import type { Metadata } from "next";
import { viewerHasPremium } from "@/lib/billing/access";
import { FreePlanNotice } from "../_components/FreePlanNotice";
import { FollowedNicheFrame } from "./_components/FollowedNicheFrame";
import { NicheGrid } from "./_components/NicheGrid";

export const metadata: Metadata = { title: "Niches" };

export default async function SkillsPage() {
  const premium = await viewerHasPremium();
  return (
    <FollowedNicheFrame>
      <div className="sf-browse">
        <header className="sf-page-head">
          <h1>Niches</h1>
          <p>Every skill on SkillFlow. Follow a free path from its card. A Premium niche opens the upgrade page until this account has Premium.</p>
        </header>
        {premium ? null : <FreePlanNotice />}
        <NicheGrid />
      </div>
    </FollowedNicheFrame>
  );
}
