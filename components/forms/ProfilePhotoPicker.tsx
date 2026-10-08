"use client";

import { useRef, useState } from "react";
import { uploadLocalFile } from "@/app/(app)/uploads/actions";
import { Icon } from "@/components/core/Icon.jsx";
import { AVATAR_STYLES, avatarDataUri, randomSeed, type AvatarStyle } from "@/lib/avatar";
import type { PhotoChoice } from "@/lib/profile-identity";

const TILES = 8;
const MAX_BYTES = 6 * 1024 * 1024;

/** Seeds that are the same on the server and in the browser, so the first paint hydrates cleanly. */
function startingSeeds(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "skillflow";
  return Array.from({ length: TILES }, (_, index) => `${base}${index}`);
}

/** Where the preview comes from for a choice. */
export function photoPreview(choice: PhotoChoice, current: string | null): string | null {
  if (choice.kind === "keep") return current;
  if (choice.kind === "none") return null;
  if (choice.kind === "upload") return choice.url;
  return avatarDataUri(choice.style, choice.seed);
}

/**
 * Choose a profile photo: keep the current one, upload a file, pick a generated avatar, or use
 * initials. Nothing is saved here; the form that holds it saves the name and the photo together.
 */
export function ProfilePhotoPicker({
  name,
  current,
  value,
  onChange,
  onBusy,
}: {
  name: string;
  current: string | null;
  value: PhotoChoice;
  onChange: (choice: PhotoChoice) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [style, setStyle] = useState<AvatarStyle>(value.kind === "avatar" ? value.style : "face");
  const [seeds, setSeeds] = useState(() => startingSeeds(name));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const preview = photoPreview(value, current);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  async function upload(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Use a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Use an image under 6 MB.");
      return;
    }
    setUploading(true);
    onBusy?.(true);
    const form = new FormData();
    form.set("file", file);
    form.set("kind", "image");
    const result = await uploadLocalFile(form).catch(() => ({ ok: false as const, error: "The upload failed. Try again." }));
    setUploading(false);
    onBusy?.(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange({ kind: "upload", url: result.url });
  }

  return (
    <div className="sf-photo">
      <div className="sf-photo-head">
        <span className="sf-photo-preview" aria-hidden="true">
          {preview ? (
            // An upload, a Google photo, or a generated SVG; hosts are not known ahead of time.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" width={88} height={88} decoding="async" />
          ) : (
            <span>{initial}</span>
          )}
        </span>
        <div className="sf-photo-actions">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sf-photo-file"
            id="sf-photo-file"
            onChange={(event) => void upload(event.target.files?.[0])}
          />
          <label htmlFor="sf-photo-file" className="sf-btn sf-btn--outline sf-btn--sm" aria-busy={uploading || undefined}>
            <Icon name="upload" size={15} /> {uploading ? "Uploading…" : "Upload a photo"}
          </label>
          {current && value.kind !== "keep" ? (
            <button type="button" className="sf-btn sf-btn--ghost sf-btn--sm" onClick={() => onChange({ kind: "keep" })}>
              Use my current photo
            </button>
          ) : null}
          {preview ? (
            <button type="button" className="sf-btn sf-btn--ghost sf-btn--sm" onClick={() => onChange({ kind: "none" })}>
              Use my initial instead
            </button>
          ) : null}
          <p className="sf-photo-note">JPG, PNG, WebP, or GIF, up to 6 MB. Shown on your profile and next to your contributions.</p>
          {error ? (
            <p className="sf-photo-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="sf-photo-generated">
        <div className="sf-photo-generated-head">
          <p id="sf-photo-generated-label">Or pick a generated avatar</p>
          <div className="sf-photo-styles" role="group" aria-label="Avatar style">
            {AVATAR_STYLES.map((item) => (
              <button key={item.id} type="button" aria-pressed={style === item.id} onClick={() => setStyle(item.id)}>
                {item.label}
              </button>
            ))}
            <button type="button" className="sf-photo-shuffle" onClick={() => setSeeds(Array.from({ length: TILES }, randomSeed))}>
              <Icon name="shuffle" size={14} /> Shuffle
            </button>
          </div>
        </div>
        <div className="sf-photo-grid" role="radiogroup" aria-labelledby="sf-photo-generated-label">
          {seeds.map((seed, index) => {
            const selected = value.kind === "avatar" && value.style === style && value.seed === seed;
            return (
              <button
                key={`${style}-${seed}`}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${AVATAR_STYLES.find((item) => item.id === style)?.label} avatar ${index + 1}`}
                className="sf-photo-tile"
                onClick={() => onChange({ kind: "avatar", style, seed })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarDataUri(style, seed)} alt="" width={56} height={56} />
                {selected ? (
                  <span className="sf-photo-check" aria-hidden="true">
                    <Icon name="check" size={12} strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
