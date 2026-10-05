"use client";

import { useRouter } from "next/navigation";

type NicheOption = { slug: string; name: string; followed: boolean };

export function NicheFilter({
  niches,
  active,
  basePath = "/nearby",
  preserve,
}: {
  niches: NicheOption[];
  active: string | null;
  basePath?: string;
  preserve?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const followed = niches.filter((niche) => niche.followed);
  const rest = niches.filter((niche) => !niche.followed);

  function href(slug: string) {
    const params = new URLSearchParams();
    if (slug) params.set("niche", slug);
    for (const [key, value] of Object.entries(preserve ?? {})) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <label className="sf-map-filter">
      Niche
      <select
        value={active ?? ""}
        onChange={(event) => {
          router.push(href(event.target.value));
        }}
      >
        <option value="">All niches</option>
        {followed.length > 0 ? (
          <optgroup label="Your niches">
            {followed.map((niche) => (
              <option key={niche.slug} value={niche.slug}>
                {niche.name}
              </option>
            ))}
          </optgroup>
        ) : null}
        {rest.length > 0 ? (
          <optgroup label="Other niches">
            {rest.map((niche) => (
              <option key={niche.slug} value={niche.slug}>
                {niche.name}
              </option>
            ))}
          </optgroup>
        ) : null}
      </select>
    </label>
  );
}
