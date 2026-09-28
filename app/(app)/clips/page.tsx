import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getClipFeed } from "@/lib/data/clips";
import { ClipFeed } from "./_components/ClipFeed";

export const metadata: Metadata = {
  title: "Clips",
};

export default async function ClipsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getClipFeed();

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <h1>Clips</h1>
        <p>Pick one skill, then short clips or videos. The feed shows only that skill.</p>
      </header>
      <ClipFeed skills={data.skills} clips={data.clips} />
    </div>
  );
}
