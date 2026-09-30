import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { normalizeCommunityUrl } from "@/lib/links/normalize-url";
import { isBlockedAddress, isMetadataHost } from "@/lib/links/ssrf";

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 5_000;
const MAX_BODY = 64 * 1024;
const BOT =
  /just a moment|cf-challenge|challenge-platform|attention required|enable javascript and cookies|verify you are human|checking your browser/i;

export type CommunityLinkVerdict =
  | { outcome: "ok"; status: number }
  | { outcome: "unreachable"; status: number | null; reason: string }
  | { outcome: "reject"; status: number | null; reason: string };

const UNSAFE = "That link cannot be checked from SkillFlow.";

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

/** Resolve the host and refuse private, loopback, link-local, and metadata addresses. */
export async function assertPublicHttps(href: string): Promise<CommunityLinkVerdict | null> {
  const url = new URL(href);
  if (isMetadataHost(url.hostname)) return { outcome: "reject", status: null, reason: UNSAFE };

  let addresses: string[];
  if (isIP(url.hostname)) {
    addresses = [url.hostname];
  } else {
    try {
      const records = await lookup(url.hostname, { all: true, verbatim: true });
      addresses = records.map((record) => record.address);
    } catch {
      return { outcome: "unreachable", status: null, reason: "The link did not resolve." };
    }
  }

  if (addresses.length === 0) return { outcome: "unreachable", status: null, reason: "The link did not resolve." };
  if (addresses.some((address) => isBlockedAddress(address))) return { outcome: "reject", status: null, reason: UNSAFE };
  return null;
}

async function follow(href: string, hops: number): Promise<CommunityLinkVerdict> {
  const blocked = await assertPublicHttps(href);
  if (blocked) return blocked;

  let response: Response;
  try {
    response = await fetch(href, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": "SkillFlowCommunityLink/1.0",
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "The link timed out.";
    return { outcome: "unreachable", status: null, reason };
  }

  if (response.status === 301 || response.status === 302 || response.status === 303 || response.status === 307 || response.status === 308) {
    await response.body?.cancel().catch(() => undefined);
    if (hops >= MAX_REDIRECTS) {
      return { outcome: "reject", status: response.status, reason: "That link redirected too many times." };
    }
    const location = response.headers.get("location");
    if (!location) return { outcome: "unreachable", status: response.status, reason: "The link redirected without a destination." };
    let next: string;
    try {
      next = new URL(location, href).toString();
    } catch {
      return { outcome: "reject", status: response.status, reason: "That link redirected to an address SkillFlow will not open." };
    }
    const normalized = normalizeCommunityUrl(next);
    if (!normalized) return { outcome: "reject", status: response.status, reason: "That link redirected to an address SkillFlow will not open." };
    return follow(normalized, hops + 1);
  }

  if (response.status === 404 || response.status === 410) {
    await response.body?.cancel().catch(() => undefined);
    return { outcome: "reject", status: response.status, reason: `That link returned ${response.status} and was not saved.` };
  }
  if (response.status === 403 || response.status === 429) {
    await response.body?.cancel().catch(() => undefined);
    return { outcome: "unreachable", status: response.status, reason: `HTTP ${response.status}` };
  }

  const snippet = await readLimited(response);
  if (response.headers.get("cf-mitigated") || BOT.test(snippet)) {
    return { outcome: "unreachable", status: response.status, reason: "The site blocked the check." };
  }
  if (response.status >= 200 && response.status < 400) return { outcome: "ok", status: response.status };
  return { outcome: "unreachable", status: response.status, reason: `HTTP ${response.status}` };
}

/** Check one community link. Does not follow redirects blindly and does not send cookies. */
export async function checkCommunityLink(input: string): Promise<CommunityLinkVerdict> {
  const normalized = normalizeCommunityUrl(input);
  if (!normalized) return { outcome: "reject", status: null, reason: "Use an https link." };
  return follow(normalized, 0);
}

export async function checkCommunitySources(urls: string[]): Promise<
  { ok: true; linkStatus: "OK" | "UNREACHABLE" | "NOT_CHECKED" } | { ok: false; error: string }
> {
  if (urls.length === 0) return { ok: true, linkStatus: "NOT_CHECKED" };
  let unreachable = false;
  for (const url of urls) {
    const result = await checkCommunityLink(url);
    if (result.outcome === "reject") return { ok: false, error: result.reason };
    if (result.outcome === "unreachable") unreachable = true;
  }
  return { ok: true, linkStatus: unreachable ? "UNREACHABLE" : "OK" };
}
