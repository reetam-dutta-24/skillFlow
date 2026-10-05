"use client";

import { useRouter } from "next/navigation";

type NicheOption = { slug: string; name: string; followed: boolean };

export function NicheFilter({ niches, active }: { niches: NicheOption[]; active: string | null }) {
  const router = useRouter();
  const followed = niches.filter((niche) => niche.followed);
  const rest = niches.filter((niche) => !niche.followed);

  return (
    <label className="sf-map-filter">
      Niche
      <select
        value={active ?? ""}
        onChange={(event) => {
          const slug = event.target.value;
          router.push(slug ? `/map?niche=${encodeURIComponent(slug)}` : "/map");
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
