import type { ReactNode } from "react";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";

/**
 * The photo banner at the top of a "Get to know SkillFlow" tile, with the tile's icon resting on its lower edge.
 * Decorative: the tile's heading carries the meaning. No hooks, so client tiles can use it too.
 */
export function HomeTileArt({ src, icon, badge, children }: { src: string; icon: string; badge?: string | null; children?: ReactNode }) {
  return (
    <div className="sf-home-tile-art" aria-hidden="true">
      <SkillImage src={src} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 360px" />
      <span className="sf-home-tile-art-shade" />
      {children}
      {badge ? <span className="sf-home-tile-badge">{badge}</span> : null}
      <span className="sf-home-tile-icon">
        <Icon name={icon} size={20} />
      </span>
    </div>
  );
}
