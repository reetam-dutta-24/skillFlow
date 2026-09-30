import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { readUploadedImage } from "@/lib/uploads";

export type CatalogSkillInput = {
  name: string;
  slug: string;
  description: string;
  image: string;
  open: boolean;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOCAL_IMAGE = /^\/skills\/[a-z0-9-]+\.(?:jpe?g|png|webp|gif)$/;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function blockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host === "0.0.0.0" || host === "127.0.0.1" || host === "::1") return true;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return true;
  return false;
}

function extensionFor(type: string) {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  return null;
}

/** Save a card photo the same way the original niches do: a file under /skills. */
export async function storeSkillImage(slug: string, image: string): Promise<string | null> {
  const trimmed = image.trim();
  if (!trimmed) return null;
  if (LOCAL_IMAGE.test(trimmed)) return trimmed;

  const uploaded = await readUploadedImage(trimmed);
  if (uploaded) {
    const directory = path.join(process.cwd(), "public", "skills");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, `${slug}.${uploaded.ext}`), uploaded.bytes);
    return `/skills/${slug}.${uploaded.ext}`;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || blockedHost(url.hostname)) return null;

  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) return null;
  const extension = extensionFor(response.headers.get("content-type") ?? "");
  if (!extension) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;

  const directory = path.join(process.cwd(), "public", "skills");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, `${slug}.${extension}`), bytes);
  return `/skills/${slug}.${extension}`;
}

export type PreparedCatalogSkill = {
  name: string;
  slug: string;
  description: string;
  image: string;
  status: "AVAILABLE" | "COMING_SOON";
  isFlagship: boolean;
};

/** Check a new niche and store its photo. The catalog service writes the row. */
export async function prepareCatalogSkill(input: CatalogSkillInput): Promise<{ ok: true; skill: PreparedCatalogSkill } | { ok: false; error: string }> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const description = input.description.trim();
  if (!name) return { ok: false, error: "Add a name." };
  if (!SLUG.test(slug)) return { ok: false, error: "Use a slug like travel-vlogging." };
  if (!input.image.trim()) return { ok: false, error: "Add an image." };

  const taken = await prisma.skill.findUnique({ where: { slug }, select: { id: true } });
  if (taken) return { ok: false, error: "That slug is already used." };

  const image = await storeSkillImage(slug, input.image);
  if (!image) return { ok: false, error: "Add an image from your device, or an https link." };

  return {
    ok: true,
    skill: {
      name,
      slug,
      description,
      image,
      status: input.open ? "AVAILABLE" : "COMING_SOON",
      isFlagship: input.open,
    },
  };
}
