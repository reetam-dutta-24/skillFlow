import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { auth } from "@/lib/auth";
import { loadPublicCreatorProfile } from "@/lib/data/creator";
import { ProfileWorks } from "./_components/ProfileWorks";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { userId } = await params;
  const profile = await loadPublicCreatorProfile(userId);
  if (!profile) notFound();
  const mine = session.user.id === profile.id;

  return (
    <div className="sf-creator-page">
      <header className="sf-page-head">
        <h1>{profile.name}</h1>
        {profile.works.length > 0 ? <Chip tone="accent">Creator</Chip> : null}
        <p>Live videos from this profile. Each one also sits in its niche on Clips.</p>
        {mine ? <Link href="/creator">Open creator studio</Link> : null}
      </header>
      {profile.works.length === 0 ? (
        <EmptyState
          icon="video"
          title="No published videos yet"
          description={mine ? "Send a video for review from Creator studio. It shows here after it is approved." : "This profile has no live videos."}
        />
      ) : (
        <ProfileWorks works={profile.works} />
      )}
    </div>
  );
}
