"use client";

import { useRef, useState } from "react";
import { SkillImage } from "@/components/core/SkillImage";
import { uploadLocalFile } from "@/app/(app)/uploads/actions";

type SourceFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  kind?: "image" | "any";
  invalid?: boolean;
  errorId?: string;
};

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  any: "image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,video/webm,video/quicktime",
} as const;

function isLocal(value: string) {
  return value.startsWith("/uploads/") || value.startsWith("/skills/");
}

/** Device file picker, plus a link field for images and other URL-backed content. */
export function SourceField({ label, value, onChange, kind = "any", invalid, errorId }: SourceFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const local = isLocal(value);
  const preview = kind === "image" && (local || value.startsWith("/"));

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("file", file);
    body.set("kind", kind);
    const result = await uploadLocalFile(body);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange(result.url);
  }

  return (
    <div className="sf-upload">
      <span className="sf-upload-label">{label}</span>
      <div className="sf-upload-actions">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Uploading..." : "Upload from device"}
        </button>
        <input
          ref={inputRef}
          className="sf-sr"
          type="file"
          accept={ACCEPT[kind]}
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {local ? <span className="sf-upload-file">File ready</span> : null}
      </div>
      <label>
        Or paste a link
        <input
          type="url"
          inputMode="url"
          placeholder="https://"
          value={local ? "" : value}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          onChange={(event) => {
            setError("");
            onChange(event.target.value);
          }}
        />
      </label>
      {preview ? (
        <span className="sf-upload-preview">
          <SkillImage src={value} alt="" width={320} height={180} sizes="320px" />
        </span>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
