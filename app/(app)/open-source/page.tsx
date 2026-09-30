import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { COMMUNITY_LABEL } from "@/lib/community-copy";
import { loadCommunityNiches, myCommunityNews } from "@/lib/data/community";
import { CommunityBrowse } from "./_components/CommunityBrowse";

export const metadata: Metadata = { title: "Open Source" };

export default async function OpenSourcePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [niches, news] = await Promise.all([loadCommunityNiches(), myCommunityNews(session.user.id)]);
  const newsBySkill = new Map(news.map((row) => [row.skillId, row.count]));
  const cards = niches.map((niche) => ({
    ...niche,
    joined: newsBySkill.has(niche.id),
    news: newsBySkill.get(niche.id) ?? 0,
  }));

  return (
    <div className="sf-browse">
      <header className="sf-page-head">
        <h1>Open Source</h1>
        <p className="sf-community-label">{COMMUNITY_LABEL}</p>
        <p>Every niche has a community. Joined ones stay first.</p>
      </header>
      <CommunityBrowse skills={cards} />
    </div>
  );
}
