import { describe, expect, it } from "vitest";
import googleSample from "@/lib/events/__fixtures__/serpapi.json";
import ticketmasterSample from "@/lib/events/__fixtures__/ticketmaster.json";
import { eventsFromGoogle } from "@/lib/events/sources/google-events-map";
import { eventsFromTicketmaster } from "@/lib/events/sources/ticketmaster-map";

const NOW = new Date("2026-10-05T12:00:00Z");

describe("eventsFromTicketmaster", () => {
  const events = eventsFromTicketmaster(ticketmasterSample, NOW);

  it("keeps a future event and the larger image", () => {
    const hack = events.find((event) => event.externalId === "vvG1");
    expect(hack).toMatchObject({
      title: "Lisbon Hack Night",
      venueName: "LX Factory",
      city: "Lisbon",
      countryCode: "PT",
      lat: 38.703,
      lng: -9.178,
      imageUrl: "https://img.example/large.jpg",
      isOnline: false,
    });
    expect(hack?.startsAt.toISOString()).toBe("2026-11-02T18:00:00.000Z");
  });

  it("drops a past event and marks an online venue", () => {
    expect(events.map((event) => event.externalId)).toEqual(["vvG1", "on1"]);
    expect(events.find((event) => event.externalId === "on1")?.isOnline).toBe(true);
  });
});

describe("eventsFromGoogle", () => {
  const events = eventsFromGoogle(googleSample, NOW);

  it("reads a month-and-day line into a future date", () => {
    const meetup = events.find((event) => event.title === "Porto Creator Meetup");
    expect(meetup?.startsAt.toISOString()).toBe("2026-11-04T19:00:00.000Z");
    expect(meetup).toMatchObject({
      city: "Porto",
      venueName: "Ribeira",
      url: "https://events.example/porto-creator",
      isOnline: false,
    });
  });

  it("keeps an online event and drops a row with no date", () => {
    expect(events.map((event) => event.title)).toEqual(["Porto Creator Meetup", "Online editing workshop"]);
    expect(events[1]?.isOnline).toBe(true);
  });
});
