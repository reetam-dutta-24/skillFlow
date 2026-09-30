/** Tracking params stripped from a community link before it is stored. */
const TRACKING = /^(?:utm_.+|fbclid|gclid|gclsrc|dclid|mc_cid|mc_eid|igshid|si|ref_src|_ga|yclid|msclkid)$/i;

/**
 * https only. Lowercase host, no fragment, no tracking params, no trailing slash.
 * Returns null when the value is not a link this community can store.
 */
export function normalizeCommunityUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;

  url.hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  url.hash = "";

  const kept = new URLSearchParams();
  const keys = [...new Set(url.searchParams.keys())].filter((key) => !TRACKING.test(key)).sort();
  for (const key of keys) {
    for (const value of url.searchParams.getAll(key)) kept.append(key, value);
  }
  url.search = kept.toString();

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}
