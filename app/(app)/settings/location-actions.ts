"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { invalidateMap } from "@/lib/cache/invalidate";
import { auth } from "@/lib/auth";
import { roundCityCoord } from "@/lib/geo/cities";
import { searchCities } from "@/lib/geo/nominatim";
import { prisma } from "@/lib/prisma";

const SIGN_IN = "Sign in again before saving.";

/** Used only when a city is saved before onboarding has written a path. */
const PLACEHOLDER_PROFILE = {
  skillSlug: "full-stack-web-dev",
  pace: "steady",
  goal: "explore",
  accent: "tide",
};

const citySchema = z.object({
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

function refreshMap() {
  invalidateMap();
  revalidatePath("/settings");
  revalidatePath("/map");
  revalidatePath("/nearby");
}

export async function searchMapCities(query: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: SIGN_IN };
  try {
    const cities = await searchCities(query);
    return { ok: true as const, cities };
  } catch {
    return { ok: false as const, error: "City search is unavailable right now. Try again in a moment." };
  }
}

export async function saveMapCity(input: { city: string; country: string; lat: number; lng: number }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: SIGN_IN };
  const parsed = citySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Choose a city from the list." };

  const userId = session.user.id;
  const location = {
    city: parsed.data.city,
    country: parsed.data.country,
    lat: roundCityCoord(parsed.data.lat),
    lng: roundCityCoord(parsed.data.lng),
  };
  await prisma.learnerProfile.upsert({
    where: { userId },
    create: { userId, ...PLACEHOLDER_PROFILE, ...location },
    update: location,
  });
  refreshMap();
  return { ok: true as const, city: parsed.data.city, country: parsed.data.country };
}

export async function clearMapCity() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: SIGN_IN };
  await prisma.learnerProfile.updateMany({
    where: { userId: session.user.id },
    data: { city: null, country: null, lat: null, lng: null, showOnMap: false },
  });
  refreshMap();
  return { ok: true as const };
}

export async function setMapVisibility(showOnMap: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: SIGN_IN };
  if (typeof showOnMap !== "boolean") return { ok: false as const, error: "Choose on or off." };

  if (showOnMap) {
    const row = await prisma.learnerProfile.findUnique({
      where: { userId: session.user.id },
      select: { city: true },
    });
    if (!row?.city) return { ok: false as const, error: "Add a city before showing it on the map." };
  }

  const result = await prisma.learnerProfile.updateMany({
    where: { userId: session.user.id },
    data: { showOnMap },
  });
  if (result.count === 0) return { ok: false as const, error: "Add a city before showing it on the map." };
  refreshMap();
  return { ok: true as const, showOnMap };
}
