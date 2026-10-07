/** Same curve as `--spectrum-day` in `app/globals.css`. 1 is yellow, 0 is the opposite blue. */
export function spectrumDay(hue: number): number {
  const turns = ((hue % 360) + 360) % 360;
  const radians = ((turns - 55) * Math.PI) / 180;
  return 0.5 + 0.5 * Math.cos(radians);
}

/**
 * Yellow through chartreuse is a light shade. Blue, purple, and red stay dark.
 * The cutoff matches the point where the page tint crosses mid lightness.
 */
export function spectrumShadeIsLight(hue: number): boolean {
  return spectrumDay(hue) >= 0.45;
}
