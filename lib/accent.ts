import { CUSTOM_THEME_KEYS, customThemeVars, parseCustomAccent } from "@/lib/accent-color";

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
  { id: "spectrum", label: "Spectrum" },
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

export function isStoredAccent(value: string | null | undefined): value is string {
  return isAccentId(value) || parseCustomAccent(value) !== null;
}

function writeAccentCookie(value: string) {
  document.cookie = `${ACCENT_STORAGE_KEY}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function clearCustomTheme(root: HTMLElement) {
  for (const key of CUSTOM_THEME_KEYS) root.style.removeProperty(key);
}

function paintCustomTheme(root: HTMLElement, token: string) {
  const parsed = parseCustomAccent(token);
  if (!parsed) return false;
  const vars = customThemeVars(parsed.start, parsed.end);
  if (!vars) return false;
  root.setAttribute("data-accent", "custom");
  for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
  return true;
}

/** Preset id or `custom:#start:#end` from the accent cookie. */
export function readStoredAccent(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${ACCENT_STORAGE_KEY}=([^;]*)`));
  if (!match) return null;
  try {
    const value = decodeURIComponent(match[1]);
    return isStoredAccent(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Runs before paint on signed-in routes. Public pages keep Dusk.
 * The cookie is read here so the root layout can stay static.
 */
export const accentBootScript = `(function(){try{var p=location.pathname;if(p==="/"||p.indexOf("/login")===0||p.indexOf("/signup")===0||p.indexOf("/privacy")===0||p.indexOf("/terms")===0)return;var m=document.cookie.match(/(?:^|; )${ACCENT_STORAGE_KEY}=([^;]*)/);if(!m)return;var a=decodeURIComponent(m[1]);var ok=${JSON.stringify(ACCENTS.map((item) => item.id))};if(ok.indexOf(a)!==-1){document.documentElement.setAttribute("data-accent",a);return;}var bits=/^custom:(#[0-9a-fA-F]{6}):(#[0-9a-fA-F]{6})$/.exec(a);if(!bits)return;function rgb(hex){return{r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)};}function hex(c){function h(n){var v=Math.max(0,Math.min(255,Math.round(n)));var s=v.toString(16);return s.length===1?"0"+s:s;}return"#"+h(c.r)+h(c.g)+h(c.b);}function mix(x,y,t){return{r:Math.round(x.r+(y.r-x.r)*t),g:Math.round(x.g+(y.g-x.g)*t),b:Math.round(x.b+(y.b-x.b)*t)};}function lum(c){function f(n){var s=n/255;return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4);}return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);}var start=rgb(bits[1]);var end=rgb(bits[2]);var mid=mix(start,end,0.5);var black={r:0,g:0,b:0};var white={r:255,g:255,b:255};var ink={r:2,g:6,b:23};var root=document.documentElement;root.setAttribute("data-accent","custom");var style=root.style;style.setProperty("--preset-gradient","linear-gradient(to left, "+hex(start)+" 0%, "+hex(mid)+" 49.5%, "+hex(end)+" 100%)");style.setProperty("--preset-gradient-v","linear-gradient(180deg, "+hex(end)+" 0%, "+hex(start)+" 100%)");style.setProperty("--preset-bright",hex(mix(end,white,0.42)));style.setProperty("--preset-soft",hex(mix(end,white,0.7)));style.setProperty("--preset-mid",hex(end));style.setProperty("--preset-deep",hex(start));style.setProperty("--preset-strong",hex(mix(start,black,0.28)));style.setProperty("--text-on-accent",lum(mid)>0.62?"#041018":"#ffffff");style.setProperty("--hue-app",hex(mix(start,ink,0.86)));style.setProperty("--hue-sidebar",hex(mix(start,black,0.92)));style.setProperty("--hue-sunken",hex(mix(start,black,0.95)));style.setProperty("--hue-elevated",hex(mix(start,ink,0.74)));style.setProperty("--hue-app-light",hex(mix(start,white,0.92)));style.setProperty("--hue-sidebar-light",hex(mix(start,white,0.88)));style.setProperty("--hue-sunken-light",hex(mix(start,white,0.82)));style.setProperty("--hue-elevated-light",hex(mix(start,white,0.96)));style.setProperty("--hue-card-light",hex(mix(start,white,0.94)));}catch(e){}})();`;

/** Swap a preset or a custom gradient and persist it for the next visit. */
export function applyStoredAccent(accent: string, target?: HTMLElement | null) {
  const root = target ?? document.documentElement;
  if (isAccentId(accent)) {
    clearCustomTheme(root);
    root.setAttribute("data-accent", accent);
  } else if (!paintCustomTheme(root, accent)) {
    return;
  }

  if (root === document.documentElement) writeAccentCookie(accent);
}

/** Swap the accent preset and persist it for the next request. */
export function applyAccent(accent: AccentId, target?: HTMLElement | null) {
  applyStoredAccent(accent, target);
}
