import { afterEach, describe, expect, it } from "vitest";
import { groupLearnerCities, mapMinLearners } from "@/lib/geo/cities";

describe("mapMinLearners", () => {
  const previous = process.env.MAP_MIN_LEARNERS;

  afterEach(() => {
    if (previous === undefined) delete process.env.MAP_MIN_LEARNERS;
    else process.env.MAP_MIN_LEARNERS = previous;
  });

  it("defaults to 5 when the env var is missing or invalid", () => {
    delete process.env.MAP_MIN_LEARNERS;
    expect(mapMinLearners()).toBe(5);
    process.env.MAP_MIN_LEARNERS = "0";
    expect(mapMinLearners()).toBe(5);
    process.env.MAP_MIN_LEARNERS = "many";
    expect(mapMinLearners()).toBe(5);
  });

  it("accepts 1 so a local map can show a single learner", () => {
    process.env.MAP_MIN_LEARNERS = "1";
    expect(mapMinLearners()).toBe(1);
  });
});

describe("groupLearnerCities", () => {
  it("hides a city under the minimum and keeps a city that meets it", () => {
    const cities = groupLearnerCities(
      [
        { city: "Lisbon", country: "Portugal", lat: 38.72, lng: -9.14 },
        { city: "Lisbon", country: "Portugal", lat: 38.73, lng: -9.15 },
        { city: "Reykjavik", country: "Iceland", lat: 64.15, lng: -21.94 },
      ],
      2,
    );
    expect(cities).toEqual([
      { city: "Lisbon", country: "Portugal", lat: 38.72, lng: -9.14, count: 2 },
    ]);
  });

  it("does not merge two cities that share a name in different countries", () => {
    const cities = groupLearnerCities(
      [
        { city: "London", country: "United Kingdom", lat: 51.51, lng: -0.13 },
        { city: "London", country: "Canada", lat: 42.98, lng: -81.25 },
      ],
      1,
    );
    expect(cities).toHaveLength(2);
  });
});
