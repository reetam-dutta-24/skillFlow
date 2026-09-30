import Image, { type ImageProps } from "next/image";

type SkillImageProps = ImageProps & {
  /** @deprecated Next.js 16 uses preload. Kept so existing call sites stay valid. */
  priority?: boolean;
};

/** Skill and lesson photos. AVIF/WebP, async decode, quality 75. */
export function SkillImage({ quality, decoding, priority, preload, alt = "", ...props }: SkillImageProps) {
  return <Image alt={alt} quality={quality ?? 75} decoding={decoding ?? "async"} preload={preload ?? Boolean(priority)} {...props} />;
}
