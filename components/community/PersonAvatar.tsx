/** Avatar and display name. Never an email. Decorative image, the name is the text. */
export function PersonAvatar({ name, image, size = 28 }: { name: string | null; image: string | null; size?: number }) {
  const label = name?.trim() || "Learner";
  return (
    <span className="sf-os-person">
      {image ? (
        <img className="sf-os-avatar" src={image} alt="" width={size} height={size} />
      ) : (
        <span className="sf-os-avatar sf-os-avatar-fallback" style={{ width: size, height: size }} aria-hidden="true">
          {label.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span>{label}</span>
    </span>
  );
}
