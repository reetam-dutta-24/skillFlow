import type { ReactNode } from "react";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";

/**
 * The top of an Open Source page: a cover photo (a niche page) or the brand wash (the feed), the title, the
 * moderation label, a few numbers, and the main actions.
 */
export function CommunityHero({
  image,
  crumb,
  title,
  label,
  description,
  stats,
  actions,
}: {
  image: string | null;
  crumb?: ReactNode;
  title: string;
  label: string;
  description?: string;
  stats: { icon: string; value: number | string; label: string }[];
  actions?: ReactNode;
}) {
  return (
    <header className="sf-oshero" data-photo={image ? "true" : undefined}>
      {image ? (
        <div className="sf-oshero-photo" aria-hidden="true">
          <SkillImage src={image} alt="" fill preload sizes="(max-width: 1100px) 100vw, 1100px" />
        </div>
      ) : (
        <div className="sf-oshero-wash" aria-hidden="true">
          <Icon name="git-pull-request" size={120} />
        </div>
      )}
      <div className="sf-oshero-inner">
        {crumb ? <div className="sf-oshero-crumb">{crumb}</div> : null}
        <h1>{title}</h1>
        <p className="sf-oshero-label">
          <Icon name="shield-check" size={14} />
          {label}
        </p>
        {description ? <p className="sf-oshero-desc">{description}</p> : null}
        <dl className="sf-oshero-stats">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt>
                <Icon name={stat.icon} size={14} />
                {stat.label}
              </dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
        {actions ? <div className="sf-oshero-actions">{actions}</div> : null}
      </div>
    </header>
  );
}
