function includesPart(text: string, part: string) {
  return part.length > 0 && text.toLowerCase().includes(part.toLowerCase());
}

/** Drop words that make a hotel name miss the map entry. */
function loosen(place: string) {
  return place
    .replace(/\bhotel\b/gi, " ")
    .replace(/[,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Short venue searches. A repeated address line makes Nominatim return nothing. */
export function venueQueries(input: {
  venueName: string | null;
  address: string | null;
  city: string | null;
  savedCity: string;
  country: string;
}): string[] {
  const venue = input.venueName?.trim() ?? "";
  const address = input.address?.trim() ?? "";
  const local = input.city?.trim() ?? "";
  const city = input.savedCity.trim();
  const country = input.country.trim();
  const place =
    venue && address && address.toLowerCase() !== venue.toLowerCase() ? `${venue}, ${address}` : venue || address;
  const withCity = includesPart(place, city) ? place : [place, city].filter(Boolean).join(", ");
  const withCountry = country && !includesPart(withCity, country) ? `${withCity}, ${country}` : withCity;
  const localLine =
    local && !includesPart(place, local) && local.toLowerCase() !== city.toLowerCase()
      ? [place, local].filter(Boolean).join(", ")
      : "";
  const loose = loosen(place);
  const looseLine =
    loose && loose.toLowerCase() !== place.toLowerCase()
      ? includesPart(loose, city)
        ? loose
        : [loose, city].filter(Boolean).join(" ")
      : "";
  const first = place.split(/[\s,]+/)[0]?.replace(/[^a-z0-9-]/gi, "") ?? "";
  const firstLine = first.length >= 6 && city ? `${first} ${city}` : "";
  const lines = [withCountry, localLine, withCity, looseLine, firstLine];
  const seen = new Set<string>();
  const queries: string[] = [];
  for (const line of lines) {
    const query = line.replace(/\s+/g, " ").trim();
    const key = query.toLowerCase();
    if (query.length < 3 || seen.has(key)) continue;
    seen.add(key);
    queries.push(query);
  }
  return queries;
}
