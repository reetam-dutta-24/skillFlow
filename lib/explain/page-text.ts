import { isIP } from "node:net";
import { isBlockedAddress, isMetadataHost } from "@/lib/links/ssrf";
import { normalizeSource } from "@/lib/explain/practice";

const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/gi;
const TRACKING = /^(?:utm_.+|gad_.+|fbclid|gclid|gclsrc|dclid|mc_cid|mc_eid|igshid|si|ref_src|_ga|yclid|msclkid|gbraid|wbraid)$/i;
const MAX_PAGES = 3;

/** A pasted address SkillFlow can try to read, or a reason to refuse it. */
export function classifyPracticeUrl(raw: string): { kind: "page"; url: string } | { kind: "blocked" } | { kind: "skip" } {
  const trimmed = raw.trim().replace(/[),.;]+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) return { kind: "skip" };
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { kind: "skip" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { kind: "skip" };
  if (url.username || url.password) return { kind: "blocked" };
  if (url.port && url.port !== "80" && url.port !== "443") return { kind: "blocked" };

  url.hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const host = url.hostname;
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return { kind: "blocked" };
  }
  if (isMetadataHost(host) || /^\d+$/.test(host)) return { kind: "blocked" };
  if (isIP(host) && isBlockedAddress(host)) return { kind: "blocked" };

  url.hash = "";
  const kept = new URLSearchParams();
  const keys = [...new Set(url.searchParams.keys())].filter((key) => !TRACKING.test(key)).sort();
  for (const key of keys) {
    for (const value of url.searchParams.getAll(key)) kept.append(key, value);
  }
  url.search = kept.toString();
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) url.pathname = url.pathname.slice(0, -1);
  return { kind: "page", url: url.toString() };
}

/** Up to three public page addresses. A private or local address blocks the whole request. */
export function planPracticeUrls(value: string): { pages: string[]; blocked: boolean } {
  const found = value.match(URL_IN_TEXT) ?? [];
  const pages: string[] = [];
  for (const raw of found) {
    const classified = classifyPracticeUrl(raw);
    if (classified.kind === "blocked") return { pages: [], blocked: true };
    if (classified.kind !== "page" || pages.includes(classified.url)) continue;
    pages.push(classified.url);
    if (pages.length === MAX_PAGES) break;
  }
  return { pages, blocked: false };
}

/** Drop addresses so a bare link is not graded as the lesson text. */
export function textWithoutUrls(value: string): string {
  return value
    .replace(URL_IN_TEXT, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, digits: string) => {
      const code = Number(digits);
      return code > 0 && code < 65536 ? String.fromCharCode(code) : " ";
    });
}

function visibleText(html: string): string {
  return decodeEntities(
    html
      .replace(/<\/(p|div|h[1-6]|li|tr|section|article|main|blockquote)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Readable text from an HTML page. Scripts, menus, and chrome are left out. */
export function htmlToText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const article = stripped.match(/<article[\s\S]*?<\/article>/i)?.[0];
  const main = stripped.match(/<main[\s\S]*?<\/main>/i)?.[0];
  const focused = article ? visibleText(article) : "";
  if (focused.length >= 40) return focused;
  const fromMain = main ? visibleText(main) : "";
  if (fromMain.length >= 40) return fromMain;
  return visibleText(stripped);
}

/** Page text first, then any passage that was not itself a link. */
export function assemblePracticeSource(pages: string[], pasted: string): string | null {
  return normalizeSource([...pages, textWithoutUrls(pasted)].filter(Boolean).join("\n\n"));
}
