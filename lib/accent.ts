export const ACCENT_STORAGE_KEY = "skillflow-accent";

export const ACCENTS = [
  { id: "tide", label: "Tide" },
  { id: "iris", label: "Iris" },
  { id: "grove", label: "Grove" },
  { id: "ember", label: "Ember" },
  { id: "dusk", label: "Dusk" },
  { id: "bloom", label: "Bloom" },
  { id: "pulse", label: "Pulse" },
  { id: "volt", label: "Volt" },
  { id: "ion", label: "Ion" },
  { id: "nova", label: "Nova" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

export const DEFAULT_ACCENT: AccentId = "tide";

/** Public pages stay on Dusk. A chosen accent is applied from onboarding onward. */
export const PUBLIC_ACCENT: AccentId = "dusk";

export function isAccentId(value: string | null | undefined): value is AccentId {
  return ACCENTS.some((accent) => accent.id === value);
}

export function resolveAccent(value: string | null | undefined): AccentId {
  return isAccentId(value) ? value : DEFAULT_ACCENT;
}

/**
 * Runs before paint on signed-in routes. Public pages keep Dusk.
 * The cookie is read here so the root layout can stay static.
 */
export const accentBootScript = `(function(){try{var p=location.pathname;if(p==="/"||p.indexOf("/login")===0||p.indexOf("/signup")===0||p.indexOf("/privacy")===0||p.indexOf("/terms")===0)return;var m=document.cookie.match(/(?:^|; )${ACCENT_STORAGE_KEY}=([^;]*)/);if(!m)return;var a=decodeURIComponent(m[1]);var ok=${JSON.stringify(ACCENTS.map((item) => item.id))};if(ok.indexOf(a)!==-1)document.documentElement.setAttribute("data-accent",a);}catch(e){}})();`;

/** Swap the accent preset and persist it for the next request. */
export function applyAccent(accent: AccentId, target?: HTMLElement | null) {
  const root = target ?? document.documentElement;
  root.setAttribute("data-accent", accent);

  if (root === document.documentElement) {
    document.cookie = `${ACCENT_STORAGE_KEY}=${accent}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
}
