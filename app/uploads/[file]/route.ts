import { open, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Serves files written to `public/uploads` while the app runs (avatars, creator videos, contribution
 * images, resource files). `next start` only serves the `public` files that existed at build time, so
 * without this route a new upload is a 404 in production. `next dev` still serves them from `public`
 * first. Names are random and never rewritten, so a file can be cached for good.
 *
 * On a host with more than one server, or a disk that does not survive a deploy, uploads belong in
 * object storage (S3) instead; this route keeps one server with a lasting disk working.
 */

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

const NAME = /^[a-z0-9]+\.(jpe?g|png|webp|gif|pdf|mp4|webm|mov)$/;
const ROOT = path.join(process.cwd(), "public", "uploads");

function headersFor(type: string, length: number) {
  return {
    "Content-Type": type,
    "Content-Length": String(length),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  };
}

async function readRange(file: string, start: number, end: number) {
  const handle = await open(file, "r");
  try {
    const buffer = Buffer.alloc(end - start + 1);
    await handle.read(buffer, 0, buffer.length, start);
    return buffer;
  } finally {
    await handle.close();
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file: name } = await params;
  const match = NAME.exec(name);
  if (!match) return new Response("Not found", { status: 404 });

  const file = path.join(ROOT, name);
  let size: number;
  try {
    const info = await stat(file);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    size = info.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const type = TYPES[match[1]];

  // Video players ask for byte ranges so they can seek. One range is enough for them.
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const body = await readRange(file, start, end);
    return new Response(new Uint8Array(body), {
      status: 206,
      headers: { ...headersFor(type, body.length), "Content-Range": `bytes ${start}-${end}/${size}` },
    });
  }

  const body = await readRange(file, 0, size - 1);
  return new Response(new Uint8Array(body), { headers: headersFor(type, size) });
}
