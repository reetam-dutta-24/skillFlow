import { describe, expect, it } from "vitest";
import { venueQueries } from "@/lib/events/venue-query";

describe("venueQueries", () => {
  it("does not repeat the venue line", () => {
    expect(
      venueQueries({
        venueName: "Sri Chamarajendra Park",
        address: "Sri Chamarajendra Park",
        city: "Bengaluru, India",
        savedCity: "Bengaluru",
        country: "India",
      }),
    ).toEqual(["Sri Chamarajendra Park, Bengaluru, India", "Sri Chamarajendra Park, Bengaluru"]);
  });

  it("does not append a city the venue name already contains", () => {
    expect(
      venueQueries({
        venueName: "Taj Yeshwantpur, Bengaluru",
        address: "Taj Yeshwantpur, Bengaluru",
        city: "Yeswanthpur",
        savedCity: "Bengaluru",
        country: "India",
      })[0],
    ).toBe("Taj Yeshwantpur, Bengaluru, India");
  });
});
