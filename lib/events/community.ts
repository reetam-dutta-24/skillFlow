import "server-only";
import { z } from "zod";
import { invalidateEvents } from "@/lib/cache/invalidate";
import { canSubmitAnother, COMMUNITY_DAILY_CAP } from "@/lib/events/quota";
import { startOfUtcDay } from "@/lib/events/config";
import { roundCityCoord } from "@/lib/geo/cities";
import { searchCities } from "@/lib/geo/nominatim";
import { prisma } from "@/lib/prisma";
import { communityActor } from "@/lib/services/community/actor";
import { canReviewContribution } from "@/lib/services/community/permissions";

const submitSchema = z.object({
  skillSlug: z.string().trim().min(1).max(80),
  title: z.string().trim().min(3).max(140),
  url: z.string().trim().url().max(400),
  startsAt: z.iso.datetime(),
  venueName: z.string().trim().max(120),
  city: z.string().trim().max(80),
  description: z.string().trim().max(1000),
  isOnline: z.boolean(),
});

export type SubmitInput = z.infer<typeof submitSchema>;

export async function submitCommunityEvent(
  userId: string,
  input: SubmitInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the title, link, and date." };
  const data = parsed.data;
  if (!data.url.startsWith("https://") && !data.url.startsWith("http://")) {
    return { ok: false, error: "The link has to start with http:// or https://." };
  }
  const startsAt = new Date(data.startsAt);
  if (startsAt.getTime() < Date.now()) return { ok: false, error: "Pick a date in the future." };
  if (!data.isOnline && data.city.length === 0) return { ok: false, error: "Add a city, or mark the event as online." };

  const skill = await prisma.skill.findUnique({ where: { slug: data.skillSlug }, select: { id: true } });
  if (!skill) return { ok: false, error: "Choose a niche." };

  const submittedToday = await prisma.event.count({
    where: { submittedById: userId, source: "COMMUNITY", createdAt: { gte: startOfUtcDay() } },
  });
  if (!canSubmitAnother(submittedToday)) {
    return { ok: false, error: `You can submit ${COMMUNITY_DAILY_CAP} events a day. Try again tomorrow.` };
  }

  let city: string | null = data.city || null;
  let countryCode: string | null = null;
  let lat: number | null = null;
  let lng: number | null = null;
  if (!data.isOnline && data.city) {
    try {
      const hits = await searchCities(data.city);
      const hit = hits[0];
      if (hit) {
        city = hit.city;
        countryCode = hit.country;
        lat = roundCityCoord(hit.lat);
        lng = roundCityCoord(hit.lng);
      }
    } catch {
      city = data.city;
    }
  }

  await prisma.event.create({
    data: {
      source: "COMMUNITY",
      skillId: skill.id,
      title: data.title,
      description: data.description || null,
      startsAt,
      venueName: data.venueName || null,
      city: data.isOnline ? null : city,
      countryCode: data.isOnline ? null : countryCode,
      lat: data.isOnline ? null : lat,
      lng: data.isOnline ? null : lng,
      url: data.url,
      isOnline: data.isOnline,
      status: "PENDING",
      submittedById: userId,
    },
  });
  return { ok: true };
}

export async function decideCommunityEvent(
  userId: string,
  eventId: string,
  decision: "approve" | "reject",
  note: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await communityActor(userId);
  if (!actor) return { ok: false, error: "Sign in again." };
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, source: true, status: true, skillId: true, submittedById: true },
  });
  if (!event || event.source !== "COMMUNITY" || event.status !== "PENDING") {
    return { ok: false, error: "That event is not waiting for review." };
  }
  if (!canReviewContribution(actor, event.skillId, event.submittedById)) {
    return { ok: false, error: "You cannot review this event." };
  }
  const reviewNote = note.trim().slice(0, 500);
  await prisma.event.update({
    where: { id: event.id },
    data:
      decision === "approve"
        ? { status: "APPROVED", reviewedById: actor.id, reviewNote: null }
        : { status: "REJECTED", reviewedById: actor.id, reviewNote: reviewNote || null },
  });
  invalidateEvents();
  return { ok: true };
}
