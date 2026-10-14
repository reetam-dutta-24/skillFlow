import Link from "next/link";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";
import { PersonAvatar } from "@/components/community/PersonAvatar";
import { disclosureLabel } from "@/lib/community-copy";
import { shortDay, typeMeta } from "./contribution-meta";

export type CardItem = {
  id: string;
  type: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  disclosure: string;
  mergedAt: string | null;
  author: { id: string; name: string | null; image: string | null } | null;
  stage: { order: number; title: string } | null;
};

/**
 * One published contribution as a card: its own image, or a colored panel for its type with the niche cover,
 * then the type, the title, a three-line summary, and who wrote it. The feed and a niche page share it.
 */
export function ContributionCard({
  item,
  slug,
  niche,
}: {
  item: CardItem;
  slug: string;
  /** Set on the mixed feed, so each card says which community it came from. */
  niche?: { name: string; image: string | null };
}) {
  const meta = typeMeta(item.type);
  const href = `/open-source/${slug}/c/${item.id}`;
  const disclosure = disclosureLabel(item.disclosure);
  const photo = item.imageUrl;

  return (
    <article className="sf-oscard" data-slot={meta.slot}>
      <Link className="sf-oscard-media" href={href} tabIndex={-1} aria-hidden="true">
        {photo ? (
          photo.startsWith("/") ? (
            <SkillImage src={photo} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 420px" />
          ) : (
            // A contribution image can be any https link, so the browser loads it directly.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" loading="lazy" decoding="async" />
          )
        ) : (
          <span className="sf-oscard-art">
            <Icon name={meta.icon} size={30} />
            {/* On the mixed feed, a small cover says which community this came from. */}
            {niche?.image ? (
              <span className="sf-oscard-cover">
                <SkillImage src={niche.image} alt="" fill sizes="56px" />
              </span>
            ) : null}
          </span>
        )}
        <span className="sf-oscard-type">
          <Icon name={meta.icon} size={13} />
          {meta.label}
        </span>
      </Link>
      <div className="sf-oscard-body">
        <div className="sf-oscard-tags">
          {niche ? <span className="sf-oscard-niche">{niche.name}</span> : null}
          {item.stage ? <span title={item.stage.title}>Stage {item.stage.order}</span> : null}
          {disclosure ? <span data-warn={item.disclosure === "AFFILIATE_OR_SPONSORED" ? "true" : undefined}>{disclosure}</span> : null}
        </div>
        <h3>
          <Link href={href}>{item.title}</Link>
        </h3>
        <p className="sf-oscard-summary">{item.summary}</p>
        <footer className="sf-oscard-foot">
          {item.author ? (
            <Link className="sf-os-person-link" href={`/profile/${item.author.id}`}>
              <PersonAvatar name={item.author.name} image={item.author.image} size={24} />
            </Link>
          ) : (
            <span className="sf-os-person">Former member</span>
          )}
          {item.mergedAt ? <time dateTime={item.mergedAt}>{shortDay(item.mergedAt)}</time> : null}
        </footer>
      </div>
    </article>
  );
}

export function ContributionGrid({ children }: { children: React.ReactNode }) {
  return <ul className="sf-oscard-grid">{children}</ul>;
}
