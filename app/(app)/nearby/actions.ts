"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { userHasPremium } from "@/lib/billing/access";
import { decideCommunityEvent, submitCommunityEvent, type SubmitInput } from "@/lib/events/community";
import { liveSearchEvents } from "@/lib/events/live";
import { searchCities } from "@/lib/geo/nominatim";

const SIGN_IN = "Sign in again before continuing.";

export async function searchLiveEvents(input: { keyword: string; city: string }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: SIGN_IN };
  let hit: { city: string; country: string; lat: number; lng: number } | undefined;
  try {
    const hits = await searchCities(input.city);
    hit = hits[0];
  } catch {
    return { ok: false as const, error: "City search is unavailable right now. Try again in a moment." };
  }
  if (!hit) return { ok: false as const, error: "Choose a city we can find." };
  const premium = session.user.role === "ADMIN" || (await userHasPremium(session.user.id));
  return liveSearchEvents({
    role: session.user.role,
    premium,
    keyword: input.keyword,
    city: hit.city,
    country: hit.country,
    lat: hit.lat,
    lng: hit.lng,
  });
}

export async function submitEvent(input: SubmitInput) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: SIGN_IN };
  const result = await submitCommunityEvent(session.user.id, input);
  if (result.ok) revalidatePath("/nearby/review");
  return result;
}

export async function reviewEvent(input: { id: string; decision: "approve" | "reject"; note: string }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: SIGN_IN };
  const result = await decideCommunityEvent(session.user.id, input.id, input.decision, input.note);
  if (result.ok) {
    revalidatePath("/nearby/events");
    revalidatePath("/nearby/review");
  }
  return result;
}
