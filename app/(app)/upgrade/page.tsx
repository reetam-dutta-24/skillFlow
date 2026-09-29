import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUpgrade } from "@/lib/data/v2";
import { UpgradePanel } from "./_components/UpgradePanel";

export const metadata: Metadata = { title: "Upgrade" };

export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { plan } = await searchParams;
  const data = await getUpgrade();
  return (
    <div className="sf-v2">
      <p className="sf-v2-label">Version 2 preview</p>
      <header className="sf-page-head">
        <h1>Upgrade</h1>
        <p>One premium tier. The price is a placeholder.</p>
      </header>
      <UpgradePanel priceLabel={data.priceLabel} premium={plan === "premium"} />
    </div>
  );
}
