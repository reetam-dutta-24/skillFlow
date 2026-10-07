import "server-only";
import { loadUpcomingEvents } from "@/lib/data/events";
import { myCommunityNews } from "@/lib/data/community";
import { formatEventWhen, selectEvents } from "@/lib/events/select";
import { retentionFor } from "@/lib/explain/recall-store";
import { prisma } from "@/lib/prisma";

export type HomeExtras = {
  notesCount: number;
  recentNotes: { id: string; concept: string; skillName: string; stageTitle: string; when: string }[];
  retention: number | null;
  city: string | null;
  events: { id: string; title: string; when: string; where: string; url: string }[];
  communityNew: number;
  contributions: { id: string; title: string; niche: string; href: string }[];
};

function shortDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Everything Home shows beyond the path lanes. Personal (notes, city, follows), so it is read on the request.
 * Events come from rows already saved for Nearby: Home never calls Ticketmaster or SerpApi.
 */
export async function loadHomeExtras(userId: string, followed: { id: string; slug: string }[]): Promise<HomeExtras> {
  const skillIds = followed.map((skill) => skill.id);
  const slugs = new Set(followed.map((skill) => skill.slug));
  const [notesCount, notes, retention, profile, news, contributions, stored] = await Promise.all([
    prisma.learnerNote.count({ where: { userId } }),
    prisma.learnerNote.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, concept: true, updatedAt: true, skill: { select: { name: true } }, stage: { select: { title: true } } },
    }),
    retentionFor(userId),
    prisma.learnerProfile.findUnique({ where: { userId }, select: { city: true, country: true, lat: true, lng: true } }),
    myCommunityNews(userId),
    skillIds.length
      ? prisma.communityContribution.findMany({
          where: { skillId: { in: skillIds }, status: "MERGED" },
          orderBy: { mergedAt: "desc" },
          take: 3,
          select: { id: true, title: true, skill: { select: { slug: true, name: true } } },
        })
      : Promise.resolve([]),
    loadUpcomingEvents(null),
  ]);

  const origin =
    profile?.city && profile.lat != null && profile.lng != null ? { city: profile.city, lat: profile.lat, lng: profile.lng } : null;
  const now = new Date();
  const relevant = stored.filter((event) => slugs.size === 0 || slugs.has(event.niche));
  const { local, online } = selectEvents(relevant, { origin, km: 50, now, until: new Date(now.getTime() + 30 * 86_400_000) });
  const events = [...local, ...online]
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 3)
    .map((event) => ({
      id: event.id,
      title: event.title,
      when: formatEventWhen(event.startsAt),
      where: event.isOnline ? "Online" : [event.venueName, event.city].filter(Boolean).join(", "),
      url: event.url,
    }));

  return {
    notesCount,
    recentNotes: notes.map((note) => ({
      id: note.id,
      concept: note.concept,
      skillName: note.skill.name,
      stageTitle: note.stage?.title ?? "Practice note",
      when: shortDate(note.updatedAt),
    })),
    retention,
    city: profile?.city ? [profile.city, profile.country].filter(Boolean).join(", ") : null,
    events,
    communityNew: news.reduce((sum, entry) => sum + entry.count, 0),
    contributions: contributions.map((row) => ({
      id: row.id,
      title: row.title,
      niche: row.skill.name,
      href: `/open-source/${row.skill.slug}/c/${row.id}`,
    })),
  };
}
