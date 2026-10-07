import { describe, expect, it } from "vitest";
import { spectrumDay, spectrumShadeIsLight } from "./spectrum-shade";

describe("spectrum shade", () => {
  it("treats yellow as a light shade and blue as a dark shade", () => {
    expect(spectrumShadeIsLight(55)).toBe(true);
    expect(spectrumShadeIsLight(70)).toBe(true);
    expect(spectrumShadeIsLight(220)).toBe(false);
    expect(spectrumShadeIsLight(280)).toBe(false);
  });

  it("peaks at yellow and bottoms out on the opposite side of the wheel", () => {
    expect(spectrumDay(55)).toBeCloseTo(1, 5);
    expect(spectrumDay(235)).toBeCloseTo(0, 5);
    expect(spectrumDay(55)).toBeGreaterThan(spectrumDay(120));
    expect(spectrumDay(120)).toBeGreaterThan(spectrumDay(200));
  });
});
