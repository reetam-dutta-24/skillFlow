/** A learner-chosen gradient. Preset ids stay as they are. This token is `custom:#start:#end`. */

const HEX = /^#[0-9a-fA-F]{6}$/;

export type Rgb = { r: number; g: number; b: number };

const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const INK: Rgb = { r: 2, g: 6, b: 23 };

export const CUSTOM_THEME_KEYS = [
  "--preset-gradient",
  "--preset-gradient-v",
  "--preset-bright",
  "--preset-soft",
  "--preset-mid",
  "--preset-deep",
  "--preset-strong",
  "--text-on-accent",
  "--hue-app",
  "--hue-sidebar",
  "--hue-sunken",
  "--hue-elevated",
  "--hue-app-light",
  "--hue-sidebar-light",
  "--hue-sunken-light",
  "--hue-elevated-light",
  "--hue-card-light",
] as const;

export function parseHex(input: string): Rgb | null {
  const trimmed = input.trim();
  const value = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!HEX.test(value)) return null;
  return {
    r: Number.parseInt(value.slice(1, 3), 16),
    g: Number.parseInt(value.slice(3, 5), 16),
    b: Number.parseInt(value.slice(5, 7), 16),
  };
}

export function rgbToHex(rgb: Rgb): string {
  const channel = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`;
}

export function mixRgb(a: Rgb, b: Rgb, towardB: number): Rgb {
  const t = Math.max(0, Math.min(1, towardB));
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

export function customAccentToken(start: string, end: string): string | null {
  const a = parseHex(start);
  const b = parseHex(end);
  if (!a || !b) return null;
  return `custom:${rgbToHex(a)}:${rgbToHex(b)}`;
}

export function parseCustomAccent(value: string | null | undefined): { start: string; end: string } | null {
  if (!value) return null;
  const match = /^custom:(#[0-9a-fA-F]{6}):(#[0-9a-fA-F]{6})$/.exec(value.trim());
  if (!match) return null;
  return { start: match[1].toLowerCase(), end: match[2].toLowerCase() };
}

function luminance(rgb: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** Brand gradient and tinted surfaces derived from the two chosen stops. */
export function customThemeVars(start: string, end: string): Record<string, string> | null {
  const a = parseHex(start);
  const b = parseHex(end);
  if (!a || !b) return null;
  const startHex = rgbToHex(a);
  const endHex = rgbToHex(b);
  const mid = mixRgb(a, b, 0.5);
  const onAccent = luminance(mid) > 0.62 ? "#041018" : "#ffffff";
  return {
    "--preset-gradient": `linear-gradient(to left, ${startHex} 0%, ${rgbToHex(mid)} 49.5%, ${endHex} 100%)`,
    "--preset-gradient-v": `linear-gradient(180deg, ${endHex} 0%, ${startHex} 100%)`,
    "--preset-bright": rgbToHex(mixRgb(b, WHITE, 0.42)),
    "--preset-soft": rgbToHex(mixRgb(b, WHITE, 0.7)),
    "--preset-mid": endHex,
    "--preset-deep": startHex,
    "--preset-strong": rgbToHex(mixRgb(a, BLACK, 0.28)),
    "--text-on-accent": onAccent,
    "--hue-app": rgbToHex(mixRgb(a, INK, 0.86)),
    "--hue-sidebar": rgbToHex(mixRgb(a, BLACK, 0.92)),
    "--hue-sunken": rgbToHex(mixRgb(a, BLACK, 0.95)),
    "--hue-elevated": rgbToHex(mixRgb(a, INK, 0.74)),
    "--hue-app-light": rgbToHex(mixRgb(a, WHITE, 0.92)),
    "--hue-sidebar-light": rgbToHex(mixRgb(a, WHITE, 0.88)),
    "--hue-sunken-light": rgbToHex(mixRgb(a, WHITE, 0.82)),
    "--hue-elevated-light": rgbToHex(mixRgb(a, WHITE, 0.96)),
    "--hue-card-light": rgbToHex(mixRgb(a, WHITE, 0.94)),
  };
}
