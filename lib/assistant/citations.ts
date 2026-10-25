/**
 * Server-side citation check, run after the model finishes. Plain code with unit tests. A `[n]` marker survives only
 * when source n was given to the model; a markdown link survives only when its URL is one of the sources or an
 * internal app route. Everything else is reduced to plain text, so the learner never sees an invented source.
 */

export type CitableSource = {
  n: number;
  url: string;
  lessonUrl?: string | null;
};

/** Internal app routes the assistant may link to without a source: a path on this site, never a protocol-relative URL. */
export function isAppRoute(url: string) {
  return /^\/(?!\/)[A-Za-z0-9\-._~/?#=&%:+@]*$/.test(url);
}

function sameUrl(left: string, right: string) {
  const strip = (value: string) => value.trim().replace(/\/+$/, "").replace(/^https?:\/\/(www\.)?/i, "").toLowerCase();
  return strip(left) === strip(right);
}

export type VerifiedAnswer = {
  text: string;
  /** The source numbers the answer still cites, in order of first use. */
  cited: number[];
  removedMarkers: number;
  removedLinks: number;
};

export function verifyCitations(raw: string, sources: readonly CitableSource[]): VerifiedAnswer {
  const numbers = new Set(sources.map((source) => source.n));
  const allowed = sources.flatMap((source) => [source.url, source.lessonUrl ?? ""]).filter(Boolean);
  let removedMarkers = 0;
  let removedLinks = 0;

  // Markdown links and images: keep the label, drop a URL that is not a source or an app route.
  let text = raw.replace(/(!?)\[([^\]\n]{0,300})\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g, (match, bang: string, label: string, url: string) => {
    if (bang) {
      removedLinks += 1;
      return label;
    }
    if (/^\d{1,3}$/.test(label.trim())) {
      // "[2](url)" is a citation written as a link: keep it as a marker and let the marker check decide.
      return `[${label.trim()}]`;
    }
    if (isAppRoute(url) || allowed.some((source) => sameUrl(source, url))) return match;
    removedLinks += 1;
    return label;
  });

  // Bare URLs that are not sources.
  text = text.replace(/(?<![(<\w])https?:\/\/[^\s)<>\]]+/g, (url) => {
    const clean = url.replace(/[.,;:!?]+$/, "");
    if (allowed.some((source) => sameUrl(source, clean))) return url;
    removedLinks += 1;
    // Keep the sentence's own punctuation that the match swallowed.
    return url.slice(clean.length);
  });

  // Citation markers, including grouped ones like [1, 3] or [1][2].
  const cited: number[] = [];
  text = text.replace(/\[(\d{1,3}(?:\s*,\s*\d{1,3})*)\](?!\()/g, (_match, group: string) => {
    const kept = group
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((n) => {
        if (numbers.has(n)) return true;
        removedMarkers += 1;
        return false;
      });
    for (const n of kept) if (!cited.includes(n)) cited.push(n);
    return kept.map((n) => `[${n}]`).join("");
  });

  text = text.replace(/[ \t]+([.,;:!?])/g, "$1").replace(/[ \t]{2,}/g, " ").trim();
  return { text, cited, removedMarkers, removedLinks };
}
