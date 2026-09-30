const TIMEOUT_MS = 15_000;

const CHALLENGE =
  /just a moment|cf-challenge|challenge-platform|attention required|enable javascript and cookies|pardon our interruption|verify you are human|checking your browser/i;

export type LinkOutcome =
  | { kind: "ok"; status: number }
  | { kind: "embedding_disabled"; status: number }
  | { kind: "removed_or_private"; status: number }
  | { kind: "needs_manual_check"; status: number; reason: string }
  | { kind: "failed"; status: number | null; reason: string };

export type LinkMismatch = { label: string; catalog: string; found: string };

export type LinkCheck = {
  outcome: LinkOutcome;
  mismatches: LinkMismatch[];
  finalUrl: string | null;
  summary: string;
};

type CheckInput = {
  type: string;
  url: string;
  title: string;
  provider: string;
  author?: string | null;
  videoId?: string | null;
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function readSnippet(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  try {
    while (text.length < 12_000) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return text.slice(0, 12_000);
}

function isBotChallenge(response: Response, body: string) {
  if (response.headers.get("cf-mitigated")) return true;
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("html") && !type.includes("text")) return false;
  return CHALLENGE.test(body);
}

async function request(url: string) {
  return fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "User-Agent": "SkillFlowCatalogCheck/1.0",
    },
  });
}

function failure(error: unknown): LinkOutcome {
  const reason = error instanceof Error ? error.message : "Could not reach the link.";
  return { kind: "failed", status: null, reason };
}

/** Removed, private, unreachable, or not embeddable. A manual check is not fatal. */
export function isFatalLink(outcome: LinkOutcome) {
  return outcome.kind === "embedding_disabled" || outcome.kind === "removed_or_private" || outcome.kind === "failed";
}

export function outcomeText(outcome: LinkOutcome) {
  if (outcome.kind === "ok") return `OK (${outcome.status})`;
  if (outcome.kind === "embedding_disabled") return `embedding disabled (${outcome.status})`;
  if (outcome.kind === "removed_or_private") return `removed or private (${outcome.status})`;
  if (outcome.kind === "needs_manual_check") return `needs manual check (${outcome.reason})`;
  return `failed (${outcome.reason})`;
}

function videoIdFrom(input: CheckInput) {
  const given = input.videoId?.trim();
  if (given) return given;
  try {
    return new URL(input.url).searchParams.get("v");
  } catch {
    return null;
  }
}

async function checkVideo(input: CheckInput): Promise<LinkCheck> {
  const videoId = videoIdFrom(input);
  if (!videoId) {
    const outcome: LinkOutcome = { kind: "failed", status: null, reason: "Missing video id." };
    return { outcome, mismatches: [], finalUrl: null, summary: outcomeText(outcome) };
  }
  const endpoint = new URL("https://www.youtube.com/oembed");
  endpoint.searchParams.set("url", `https://www.youtube.com/watch?v=${videoId}`);
  endpoint.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await request(endpoint.toString());
  } catch (error) {
    const outcome = failure(error);
    return { outcome, mismatches: [], finalUrl: null, summary: outcomeText(outcome) };
  }

  if (response.status === 401 || response.status === 403) {
    await response.body?.cancel().catch(() => undefined);
    const outcome: LinkOutcome = { kind: "embedding_disabled", status: response.status };
    return { outcome, mismatches: [], finalUrl: null, summary: outcomeText(outcome) };
  }
  if (response.status === 404) {
    await response.body?.cancel().catch(() => undefined);
    const outcome: LinkOutcome = { kind: "removed_or_private", status: response.status };
    return { outcome, mismatches: [], finalUrl: null, summary: outcomeText(outcome) };
  }
  if (response.status < 200 || response.status >= 300) {
    await response.body?.cancel().catch(() => undefined);
    const outcome: LinkOutcome = { kind: "failed", status: response.status, reason: `HTTP ${response.status}` };
    return { outcome, mismatches: [], finalUrl: null, summary: outcomeText(outcome) };
  }

  let payload: { title?: unknown; author_name?: unknown };
  try {
    payload = (await response.json()) as { title?: unknown; author_name?: unknown };
  } catch {
    const outcome: LinkOutcome = { kind: "failed", status: response.status, reason: "Oembed response was not JSON." };
    return { outcome, mismatches: [], finalUrl: null, summary: outcomeText(outcome) };
  }
  if (typeof payload.title !== "string" || typeof payload.author_name !== "string") {
    const outcome: LinkOutcome = { kind: "failed", status: response.status, reason: "Oembed response had no title or author." };
    return { outcome, mismatches: [], finalUrl: null, summary: outcomeText(outcome) };
  }

  const mismatches: LinkMismatch[] = [];
  if (normalize(input.title) !== normalize(payload.title)) {
    mismatches.push({ label: "Title", catalog: input.title, found: payload.title });
  }
  if (normalize(input.provider) !== normalize(payload.author_name)) {
    mismatches.push({ label: "Author", catalog: input.provider, found: payload.author_name });
  }
  if (input.author && normalize(input.author) !== normalize(payload.author_name)) {
    mismatches.push({ label: "Author credit", catalog: input.author, found: payload.author_name });
  }
  const outcome: LinkOutcome = { kind: "ok", status: response.status };
  const summary = [outcomeText(outcome), ...mismatches.map((item) => `${item.label}: catalog "${item.catalog}" / YouTube "${item.found}"`)].join(". ");
  return { outcome, mismatches, finalUrl: null, summary };
}

async function checkPage(url: string): Promise<LinkCheck> {
  let response: Response;
  try {
    response = await request(url);
  } catch (error) {
    const outcome = failure(error);
    return { outcome, mismatches: [], finalUrl: null, summary: outcomeText(outcome) };
  }

  const finalUrl = response.url && response.url !== url ? response.url : null;
  if (response.status === 403 || response.status === 429) {
    await response.body?.cancel().catch(() => undefined);
    const outcome: LinkOutcome = { kind: "needs_manual_check", status: response.status, reason: `HTTP ${response.status}` };
    return { outcome, mismatches: [], finalUrl, summary: outcomeText(outcome) };
  }

  const body = await readSnippet(response);
  if (isBotChallenge(response, body)) {
    const outcome: LinkOutcome = { kind: "needs_manual_check", status: response.status, reason: "bot challenge" };
    return { outcome, mismatches: [], finalUrl, summary: outcomeText(outcome) };
  }
  if (response.status >= 200 && response.status < 300) {
    const outcome: LinkOutcome = { kind: "ok", status: response.status };
    return { outcome, mismatches: [], finalUrl, summary: outcomeText(outcome) };
  }
  const outcome: LinkOutcome = { kind: "failed", status: response.status, reason: `HTTP ${response.status}` };
  return { outcome, mismatches: [], finalUrl, summary: outcomeText(outcome) };
}

/** The same check the catalog verifier uses for one resource. */
export async function checkCatalogLink(input: CheckInput): Promise<LinkCheck> {
  if (input.url.startsWith("/uploads/")) {
    const outcome: LinkOutcome = { kind: "ok", status: 200 };
    return { outcome, mismatches: [], finalUrl: null, summary: "Uploaded file. There is no remote link to check." };
  }
  if (input.type === "EMBEDDED_VIDEO" || input.type === "HOOK_CLIP") return checkVideo(input);
  return checkPage(input.url);
}
