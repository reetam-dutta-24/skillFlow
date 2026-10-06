type NominatimRow = { lat?: string; lon?: string };

let gate: Promise<void> = Promise.resolve();

/** One Nominatim search at a time. Their public service allows about one request a second. */
function waitTurn(): Promise<void> {
  const turn = gate.then(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 1100);
      }),
  );
  gate = turn.then(
    () => undefined,
    () => undefined,
  );
  return turn;
}

export async function lookupVenue(query: string): Promise<{ lat: number; lng: number } | null> {
  await waitTurn();
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", query);

  const userAgent = process.env.GEOCODER_USER_AGENT?.trim() || "SkillFlow/1.0 (learner map)";
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": userAgent },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`nominatim ${response.status}`);
  const rows = (await response.json()) as NominatimRow[];
  const lat = Number(rows[0]?.lat);
  const lng = Number(rows[0]?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
