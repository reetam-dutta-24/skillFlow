/**
 * Generated profile photos. Plain code, no package: a style and a short seed always draw the same SVG.
 * The picker previews the SVG in the browser; the server draws the same SVG again from the style and
 * seed (never from SVG sent by the browser) and stores it as a PNG upload.
 */

export const AVATAR_STYLES = [
  { id: "face", label: "Face" },
  { id: "shapes", label: "Shapes" },
  { id: "rings", label: "Rings" },
  { id: "pixels", label: "Pixels" },
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number]["id"];

const STYLE_IDS = new Set<string>(AVATAR_STYLES.map((style) => style.id));
const SEED = /^[a-z0-9]{1,24}$/;

export function isAvatarChoice(style: unknown, seed: unknown): style is AvatarStyle {
  return typeof style === "string" && STYLE_IDS.has(style) && typeof seed === "string" && SEED.test(seed);
}

/** A fresh random seed for the Shuffle button. */
export function randomSeed() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 10);
}

// Background, two accents, and a third accent. Picked by hand so every pair reads on the background.
const PALETTES = [
  ["#264653", "#2a9d8f", "#e9c46a", "#f4a261"],
  ["#3d348b", "#7678ed", "#f7b801", "#f18701"],
  ["#0b3954", "#087e8b", "#bfd7ea", "#ff5a5f"],
  ["#2b2d42", "#8d99ae", "#edf2f4", "#ef233c"],
  ["#1b4332", "#40916c", "#95d5b2", "#ffd166"],
  ["#14213d", "#fca311", "#e5e5e5", "#00b4d8"],
  ["#5f0f40", "#fb8b24", "#ffd6a5", "#e36414"],
  ["#03045e", "#0077b6", "#90e0ef", "#caf0f8"],
  ["#432818", "#bb9457", "#ffe6a7", "#99582a"],
  ["#22223b", "#9a8c98", "#c9ada7", "#f2e9e4"],
  ["#006d77", "#83c5be", "#edf6f9", "#e29578"],
  ["#3a0ca3", "#f72585", "#4cc9f0", "#b8f2e6"],
] as const;

/** FNV-1a, then mulberry32: a small, stable random sequence from the seed. */
function random(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rand: () => number, low: number, high: number) => low + rand() * (high - low);
const pick = <T,>(rand: () => number, list: readonly T[]) => list[Math.floor(rand() * list.length)];

function isLight(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150;
}

const round = (value: number) => Math.round(value * 10) / 10;

function face(rand: () => number, palette: readonly string[]) {
  const [bg] = palette;
  const head = pick(rand, palette.slice(1));
  const ink = isLight(head) ? "#16141f" : "#ffffff";
  const tx = round(between(rand, -9, 9));
  const ty = round(between(rand, -6, 8));
  const turn = round(between(rand, -14, 14));
  const radius = round(between(rand, 26, 40));
  const eyeY = round(between(rand, 52, 58));
  const gap = round(between(rand, 10, 14));
  const smile = rand() > 0.35;
  const mouthY = eyeY + 18;
  const mouth = smile
    ? `<path d="M${60 - 10} ${mouthY} Q60 ${mouthY + 10} ${60 + 10} ${mouthY}" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`
    : `<path d="M${60 - 8} ${mouthY} Q60 ${mouthY + 9} ${60 + 8} ${mouthY} Z" fill="${ink}"/>`;
  const cheeks =
    rand() > 0.5
      ? `<circle cx="${60 - gap - 9}" cy="${eyeY + 11}" r="4.5" fill="${palette[3]}" opacity="0.55"/><circle cx="${60 + gap + 9}" cy="${eyeY + 11}" r="4.5" fill="${palette[3]}" opacity="0.55"/>`
      : "";
  return (
    `<rect width="120" height="120" fill="${bg}"/>` +
    `<g transform="translate(${tx} ${ty}) rotate(${turn} 60 60)">` +
    `<rect x="18" y="18" width="84" height="84" rx="${radius}" fill="${head}"/>` +
    `<ellipse cx="${60 - gap}" cy="${eyeY}" rx="4.5" ry="5.5" fill="${ink}"/>` +
    `<ellipse cx="${60 + gap}" cy="${eyeY}" rx="4.5" ry="5.5" fill="${ink}"/>` +
    cheeks +
    mouth +
    `</g>`
  );
}

function shapes(rand: () => number, palette: readonly string[]) {
  const [bg, a, b, c] = palette;
  const circle = `<circle cx="${round(between(rand, 25, 95))}" cy="${round(between(rand, 25, 95))}" r="${round(between(rand, 26, 44))}" fill="${a}"/>`;
  const size = round(between(rand, 38, 60));
  const square = `<rect x="${round(between(rand, 10, 120 - size - 10))}" y="${round(between(rand, 10, 120 - size - 10))}" width="${size}" height="${size}" rx="6" fill="${b}" opacity="0.92" transform="rotate(${round(between(rand, -40, 40))} 60 60)"/>`;
  const x = round(between(rand, 30, 90));
  const y = round(between(rand, 30, 90));
  const s = round(between(rand, 22, 34));
  const triangle = `<path d="M${x} ${y - s} L${x + s} ${y + s * 0.8} L${x - s} ${y + s * 0.8} Z" fill="${c}" opacity="0.9" transform="rotate(${round(between(rand, 0, 120))} ${x} ${y})"/>`;
  const order = rand() > 0.5 ? [circle, square, triangle] : [square, triangle, circle];
  return `<rect width="120" height="120" fill="${bg}"/>${order.join("")}`;
}

function rings(rand: () => number, palette: readonly string[]) {
  const [bg, ...colors] = palette;
  const cx = round(between(rand, 44, 76));
  const cy = round(between(rand, 44, 76));
  let out = `<rect width="120" height="120" fill="${bg}"/>`;
  [52, 38, 25, 12].forEach((radius, index) => {
    const color = colors[(index + Math.floor(rand() * 3)) % colors.length];
    const circumference = 2 * Math.PI * radius;
    const shown = round(circumference * between(rand, 0.55, 0.95));
    out += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${shown} ${round(circumference)}" transform="rotate(${round(between(rand, 0, 360))} ${cx} ${cy})"/>`;
  });
  return out;
}

function pixels(rand: () => number, palette: readonly string[]) {
  const [bg, a, b] = palette;
  let out = `<rect width="120" height="120" fill="${bg}"/>`;
  const cell = 16;
  const start = 20;
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      if (rand() < 0.45) continue;
      const color = rand() > 0.3 ? a : b;
      // Mirrored left to right, like a classic identicon.
      for (const x of column === 2 ? [2] : [column, 4 - column]) {
        out += `<rect x="${start + x * cell}" y="${start + row * cell}" width="${cell}" height="${cell}" fill="${color}"/>`;
      }
    }
  }
  return out;
}

const DRAW: Record<AvatarStyle, (rand: () => number, palette: readonly string[]) => string> = { face, shapes, rings, pixels };

/** The SVG for one style and seed. Only numbers and fixed colors go into it, so it is safe to render. */
export function avatarSvg(style: AvatarStyle, seed: string) {
  const rand = random(`${style}:${seed}`);
  const palette = pick(rand, PALETTES);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="256" height="256">${DRAW[style](rand, palette)}</svg>`;
}

/** For a preview `<img>` in the browser. */
export function avatarDataUri(style: AvatarStyle, seed: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg(style, seed))}`;
}
