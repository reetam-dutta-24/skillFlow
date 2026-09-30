/** A saved upload, or an https link. Safe to import from client components. */
export const UPLOAD_PATH = /^\/uploads\/[a-z0-9]+\.(?:jpe?g|png|webp|gif|pdf|mp4|webm|mov)$/;

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
