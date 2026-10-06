import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { PRACTICE_SOURCE_TAG } from "@/lib/cache/tags";
import { assertPublicHttps } from "@/lib/links/check";
import { htmlToText } from "@/lib/explain/page-text";

const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 8_000;
const MAX_BODY = 350_000;
const MAX_TEXT = 12_000;
const BOT =
  /just a moment|cf-challenge|challenge-platform|attention required|enable javascript and cookies|verify you are human|checking your browser/i;

async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  try {
    while (text.length < MAX_BODY) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return text.slice(0, MAX_BODY);
}

function pageText(body: string, contentType: string): string | null {
  const type = contentType.toLowerCase();
  const html = type.includes("html") || type.includes("xml") || (!type && /<html[\s>]/i.test(body));
  const plain = type.includes("text/plain") || type.includes("markdown") || type.includes("text/markdown");
  if (!html && !plain) return null;
  const text = (html ? htmlToText(body) : body).replace(/\u0000/g, "").trim();
  if (text.length < 40 || BOT.test(text.slice(0, 2_000))) return null;
  return text.slice(0, MAX_TEXT);
}

/** Read one public page. Null when the site blocks the read or the body is not text. Throws when the host is private. */
async function fetchPracticePage(href: string, hops: number): Promise<string | null> {
  const blocked = await assertPublicHttps(href);
  if (blocked?.outcome === "reject") throw new Error("practice page blocked");
  if (blocked) return null;

  let response: Response;
  try {
    response = await fetch(href, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.8",
        "User-Agent": "SkillFlowPractice/1.0",
      },
    });
  } catch {
    return null;
  }

  if (response.status === 301 || response.status === 302 || response.status === 303 || response.status === 307 || response.status === 308) {
    await response.body?.cancel().catch(() => undefined);
    if (hops >= MAX_REDIRECTS) return null;
    const location = response.headers.get("location");
    if (!location) return null;
    let next: string;
    try {
      next = new URL(location, href).toString();
    } catch {
      return null;
    }
    if (!/^https?:\/\//i.test(next)) throw new Error("practice page blocked");
    return fetchPracticePage(next, hops + 1);
  }

  if (response.status < 200 || response.status >= 400) {
    await response.body?.cancel().catch(() => undefined);
    return null;
  }

  const body = await readLimited(response);
  return pageText(body, response.headers.get("content-type") ?? "");
}

/**
 * The words on a public page. The same page is the same text for every learner,
 * so a successful read is cached. A miss is not cached. Do not call `auth()` in here.
 */
export async function readPracticePage(url: string): Promise<string> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRACTICE_SOURCE_TAG);
  const text = await fetchPracticePage(url, 0);
  if (!text) throw new Error("practice page unreadable");
  return text;
}

function refused(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("practice page blocked");
}

export async function loadPracticePages(urls: string[]): Promise<{ texts: string[]; blocked: boolean; missed: boolean }> {
  const texts: string[] = [];
  let missed = false;
  for (const url of urls) {
    try {
      const text = await readPracticePage(url);
      texts.push(`Page (${url}):\n${text}`);
    } catch (error) {
      if (refused(error)) return { texts: [], blocked: true, missed: false };
      missed = true;
    }
  }
  return { texts, blocked: false, missed };
}
