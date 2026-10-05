import { describe, expect, it } from "vitest";
import { distanceKm, formatDistanceKm } from "@/lib/geo/distance";

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    expect(distanceKm({ lat: 38.72, lng: -9.14 }, { lat: 38.72, lng: -9.14 })).toBe(0);
  });

  it("is about 111 km for one degree of longitude at the equator", () => {
    const km = distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(112);
  });

  it("puts Lisbon and Porto a few hundred kilometres apart", () => {
    const km = distanceKm({ lat: 38.7223, lng: -9.1393 }, { lat: 41.1579, lng: -8.6291 });
    expect(km).toBeGreaterThan(250);
    expect(km).toBeLessThan(300);
  });
});

describe("formatDistanceKm", () => {
  it("rounds to a whole number of kilometres", () => {
    expect(formatDistanceKm(12.4)).toBe("12 km away");
  });

  it("does not pretend a short hop is a precise kilometre", () => {
    expect(formatDistanceKm(0.4)).toBe("Under 1 km away");
  });
});
