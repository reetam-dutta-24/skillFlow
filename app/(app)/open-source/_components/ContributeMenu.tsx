"use client";

import { useState } from "react";
import Link from "next/link";
import { SkillImage } from "@/components/core/SkillImage";

export function ContributeMenu({
  niches,
}: {
  niches: { slug: string; name: string; image: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  if (niches.length === 0) return null;
  if (niches.length === 1) {
    return (
      <Link className="sf-os-primary" href={`/open-source/${niches[0].slug}/contribute`}>
        Add a contribution
      </Link>
    );
  }

  return (
    <div className="sf-os-menu">
      <button type="button" className="sf-os-primary" aria-expanded={open} aria-controls="contribute-menu" onClick={() => setOpen((value) => !value)}>
        Add a contribution
      </button>
      {open ? (
        <ul id="contribute-menu">
          {niches.map((niche) => (
            <li key={niche.slug}>
              <Link href={`/open-source/${niche.slug}/contribute`} onClick={() => setOpen(false)}>
                {niche.image ? <SkillImage src={niche.image} alt="" width={36} height={36} /> : <span className="sf-os-thumb-fallback" aria-hidden="true" />}
                {niche.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
