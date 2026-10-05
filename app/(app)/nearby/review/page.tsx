import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { formatEventWhen } from "@/lib/events/select";
import { prisma } from "@/lib/prisma";
import { communityActor } from "@/lib/services/community/actor";
import { canReviewContribution } from "@/lib/services/community/permissions";
import { ReviewEventActions } from "../_components/ReviewEventActions";

export const metadata: Metadata = { title: "Review events" };

export default async function ReviewEventsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const actor = await communityActor(session.user.id);
  const pending = actor
    ? await prisma.event.findMany({
        where: { source: "COMMUNITY", status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: 50,
        select: {
          id: true,
          title: true,
          startsAt: true,
          venueName: true,
          city: true,
          url: true,
          isOnline: true,
          skillId: true,
          submittedById: true,
          skill: { select: { name: true } },
        },
      })
    : [];
  const visible = actor
    ? pending.filter((event) => canReviewContribution(actor, event.skillId, event.submittedById))
    : [];

  return (
    <div className="sf-map-page">
      <header className="sf-page-head">
        <h1>Review events</h1>
        <p>Approve or reject community events for the niches you review.</p>
      </header>
      {visible.length === 0 ? (
        <p className="sf-event-empty">Nothing waiting.</p>
      ) : (
        <div className="sf-event-online-list">
          {visible.map((event) => (
            <article key={event.id} className="sf-event-card">
              <h2>{event.title}</h2>
              <p>{formatEventWhen(event.startsAt.toISOString())}</p>
              <p>{event.isOnline ? "Online" : [event.venueName, event.city].filter(Boolean).join(", ")}</p>
              <p>{event.skill.name}</p>
              <a href={event.url} target="_blank" rel="noreferrer">
                Open event
              </a>
              <ReviewEventActions id={event.id} />
            </article>
          ))}
        </div>
      )}
      <p className="sf-event-links">
        <Link href="/nearby/events">Back to events</Link>
      </p>
    </div>
  );
}
