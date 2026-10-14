import Link from "next/link";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";

export type StripNiche = {
  slug: string;
  name: string;
  image: string | null;
  merged: number;
  members: number;
  followed: boolean;
  news: number;
};

/** A horizontal row of community covers: the ones this learner follows first, then the busiest. */
export function CommunityStrip({ title, niches }: { title: string; niches: StripNiche[] }) {
  if (niches.length === 0) return null;
  return (
    <section className="sf-osstrip" aria-labelledby="os-strip-title">
      <h2 id="os-strip-title">{title}</h2>
      <ul>
        {niches.map((niche) => (
          <li key={niche.slug}>
            <Link className="sf-osstrip-card" href={`/open-source/${niche.slug}`}>
              <span className="sf-osstrip-photo" aria-hidden="true">
                {niche.image ? <SkillImage src={niche.image} alt="" fill sizes="220px" /> : null}
                {niche.news > 0 ? <span className="sf-osstrip-new">{niche.news} new</span> : null}
              </span>
              <span className="sf-osstrip-copy">
                <strong>{niche.name}</strong>
                <span>
                  <Icon name="git-pull-request" size={12} /> {niche.merged}
                  <Icon name="users" size={12} /> {niche.members}
                  {niche.followed ? <em>Following</em> : null}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
