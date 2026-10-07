/** A saved upload, or an https link. Safe to import from client components. */
export const UPLOAD_PATH = /^\/uploads\/[a-z0-9]+\.(?:jpe?g|png|webp|gif|pdf|mp4|webm|mov)$/;

/** A committed stage photo, `public/stages/<slug>/<order>.jpg`. */
export const STAGE_PHOTO = /^\/stages\/[a-z0-9-]+\/\d+\.(?:jpe?g|png|webp)$/;

/** An image for a stage: an upload, an https link, or one of the committed stage photos. */
export function storedImage(value: string): string | null {
  const trimmed = value.trim();
  if (STAGE_PHOTO.test(trimmed)) return trimmed;
  return storedSource(trimmed);
}

export function storedSource(value: string): string | null {
  const trimmed = value.trim();
  if (UPLOAD_PATH.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
