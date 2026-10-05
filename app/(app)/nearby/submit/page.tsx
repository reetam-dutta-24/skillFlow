import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitEventForm } from "../_components/SubmitEventForm";

export const metadata: Metadata = { title: "Submit an event" };

export default async function SubmitEventPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [skills, profile] = await Promise.all([
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.learnerProfile.findUnique({ where: { userId: session.user.id }, select: { city: true } }),
  ]);

  return (
    <div className="sf-map-page">
      <header className="sf-page-head">
        <h1>Submit an event</h1>
        <p>Three a day. A reviewer for that niche approves it before anyone else sees it. Links only.</p>
      </header>
      <SubmitEventForm niches={skills} city={profile?.city ?? null} />
      <p className="sf-event-links">
        <Link href="/nearby/events">Back to events</Link>
      </p>
    </div>
  );
}
