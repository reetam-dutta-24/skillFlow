import { SkillImage } from "@/components/core/SkillImage";

/**
 * The explain-back backdrop: the stage photo (or the path cover), blurred and under a dark shade, fixed behind the
 * page so the gate feels like its own room. Purely decorative: hidden from assistive tech, never interactive. With no
 * photo, a soft wash in the learner's accent takes its place. The words always sit on the panel above it, never on
 * the photo, so contrast does not depend on the picture.
 */
export function GateBackdrop({ src }: { src: string | null }) {
  return (
    <div className="sf-gate-backdrop" data-kind={src ? "photo" : "wash"} aria-hidden="true">
      {/* Blurred, so a small rendition is plenty; quality stays at the one value next.config allows (75). */}
      {src ? <SkillImage src={src} alt="" fill sizes="50vw" className="sf-gate-backdrop-img" /> : null}
    </div>
  );
}
