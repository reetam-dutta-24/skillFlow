import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLeaderboard } from "@/lib/data/v2";
import { LeaderboardBoard } from "./_components/LeaderboardBoard";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { tab } = await searchParams;
  const scope = tab === "country" || tab === "city" ? tab : "global";
  const rows = await getLeaderboard(session.user.name ?? null);
  return (
    <div className="sf-v2">
      <p className="sf-v2-label">Version 2 preview</p>
      <header className="sf-page-head">
        <h1>Leaderboard</h1>
        <p>Score is verified mastery, never time spent. There are no prizes.</p>
      </header>
      <LeaderboardBoard rows={rows} scope={scope} />
    </div>
  );
}
