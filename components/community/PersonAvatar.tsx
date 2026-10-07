import { SkillImage } from "@/components/core/SkillImage";

/** Avatar and display name. Never an email. Decorative image, the name is the text. */
export function PersonAvatar({ name, image, size = 28 }: { name: string | null; image: string | null; size?: number }) {
  const label = name?.trim() || "Learner";
  return (
    <span className="sf-os-person">
      {image?.startsWith("/") ? (
        <SkillImage className="sf-os-avatar" src={image} alt="" width={size * 2} height={size * 2} sizes={`${size}px`} style={{ width: size, height: size }} />
      ) : image ? (
        // A remote avatar (Google sign-in). The host is not in the image config, so the browser loads it directly.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="sf-os-avatar" src={image} alt="" width={size} height={size} loading="lazy" decoding="async" />
      ) : (
        <span className="sf-os-avatar sf-os-avatar-fallback" style={{ width: size, height: size }} aria-hidden="true">
          {label.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span>{label}</span>
    </span>
  );
}
