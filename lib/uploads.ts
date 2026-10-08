import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const IMAGE_BYTES = 6 * 1024 * 1024;
const DOC_BYTES = 12 * 1024 * 1024;
const VIDEO_BYTES = 40 * 1024 * 1024;

type Kind = "image" | "doc" | "video";

const BY_TYPE: Record<string, { ext: string; kind: Kind }> = {
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/png": { ext: "png", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "image/gif": { ext: "gif", kind: "image" },
  "application/pdf": { ext: "pdf", kind: "doc" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
};

const BY_EXT: Record<string, { ext: string; kind: Kind }> = {
  jpg: BY_TYPE["image/jpeg"],
  jpeg: BY_TYPE["image/jpeg"],
  png: BY_TYPE["image/png"],
  webp: BY_TYPE["image/webp"],
  gif: BY_TYPE["image/gif"],
  pdf: BY_TYPE["application/pdf"],
  mp4: BY_TYPE["video/mp4"],
  webm: BY_TYPE["video/webm"],
  mov: BY_TYPE["video/quicktime"],
};

function specFor(file: File) {
  const fromType = BY_TYPE[file.type];
  if (fromType) return fromType;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXT[ext] ?? null;
}

function matchesMagic(bytes: Buffer, ext: string) {
  if (ext === "jpg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (ext === "png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (ext === "gif") return bytes.subarray(0, 3).toString("ascii") === "GIF";
  if (ext === "webp") return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (ext === "pdf") return bytes.subarray(0, 4).toString("ascii") === "%PDF";
  if (ext === "webm") return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (ext === "mp4" || ext === "mov") return bytes.subarray(4, 8).toString("ascii") === "ftyp";
  return false;
}

/** Write one learner or admin file under public/uploads and return its public path. */
export async function saveUploadedFile(file: File, kind: string) {
  if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: "Choose a file." };
  const spec = specFor(file);
  if (!spec) return { ok: false as const, error: "Use an image, a PDF, or a video." };
  if (kind === "image" && spec.kind !== "image") return { ok: false as const, error: "Use an image file." };
  if (kind === "video" && spec.kind !== "video") return { ok: false as const, error: "Use an mp4, webm, or mov file." };

  const max = spec.kind === "video" ? VIDEO_BYTES : spec.kind === "doc" ? DOC_BYTES : IMAGE_BYTES;
  if (file.size > max) return { ok: false as const, error: "That file is too large." };

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesMagic(bytes, spec.ext)) return { ok: false as const, error: "That file could not be read." };

  const name = `${randomBytes(12).toString("hex")}.${spec.ext}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes);
  return { ok: true as const, url: `/uploads/${name}` };
}

/** Write image bytes the server made or fetched itself (a generated avatar, a niche cover) under public/uploads. */
export async function saveImageBytes(bytes: Buffer, ext: "png" | "jpg" | "webp" | "gif") {
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes);
  return `/uploads/${name}`;
}

/** Copy a previously uploaded image onto the skill card path. */
export async function readUploadedImage(publicPath: string): Promise<{ bytes: Buffer; ext: string } | null> {
  const match = /^\/uploads\/([a-z0-9]+)\.(jpe?g|png|webp|gif)$/.exec(publicPath);
  if (!match) return null;
  const root = path.join(process.cwd(), "public", "uploads");
  const source = path.resolve(root, `${match[1]}.${match[2]}`);
  const relative = path.relative(root, source);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  try {
    const bytes = await readFile(source);
    return { bytes, ext: match[2] === "jpeg" ? "jpg" : match[2] };
  } catch {
    return null;
  }
}
