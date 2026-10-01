import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getClipFeed } from "@/lib/data/clips";
import { ClipFeed } from "./_components/ClipFeed";

export const metadata: Metadata = {
  title: "Clips",
};

export default async function ClipsPage({ searchParams }: { searchParams: Promise<{ skill?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { skill } = await searchParams;
  const data = await getClipFeed();

  return (
    <div className="sf-clips-page">
      <ClipFeed skills={data.skills} clips={data.clips} initialSlug={skill ?? ""} />
    </div>
  );
}
