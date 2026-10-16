import { describe, expect, it } from "vitest";
import { groupHits, normalize, scoreEntry, searchEntries, type SearchEntry } from "@/lib/search/score";
import { SEARCH_SUGGESTIONS, STATIC_SEARCH } from "@/lib/search/static";

const entry = (over: Partial<SearchEntry>): SearchEntry => ({ id: "x", kind: "page", title: "Untitled", href: "/", ...over });

describe("normalize", () => {
  it("lowercases, drops accents, and turns punctuation into spaces", () => {
    expect(normalize("  Café & Crème — Full-Stack!  ")).toBe("cafe creme full stack");
  });
});

describe("scoring", () => {
  it("needs every query word to match somewhere", () => {
    const notes = entry({ title: "Notes", keywords: ["export", "pdf"] });
    expect(scoreEntry(notes, "notes pdf")).toBeGreaterThan(0);
    expect(scoreEntry(notes, "notes chess")).toBe(0);
  });

  it("ranks the title over keywords over the description, and word starts over the middle", () => {
    const title = entry({ id: "a", title: "Recall" });
    const keyword = entry({ id: "b", title: "Notes", keywords: ["recall"] });
    const description = entry({ id: "c", title: "Progress", description: "retention and recall" });
    const ranked = searchEntries([description, keyword, title], "recall").map((hit) => hit.id);
    expect(ranked).toEqual(["a", "b", "c"]);
    expect(scoreEntry(entry({ title: "Photography" }), "photo")).toBeGreaterThan(scoreEntry(entry({ title: "Telephoto lenses" }), "photo"));
  });

  it("forgives one typo in a word of four letters or more", () => {
    expect(scoreEntry(entry({ title: "Photography" }), "photgraphy")).toBeGreaterThan(0);
    expect(scoreEntry(entry({ title: "Analytics" }), "anlaytics")).toBeGreaterThan(0);
    expect(scoreEntry(entry({ title: "Photography" }), "photoograhpy")).toBe(0);
    expect(scoreEntry(entry({ title: "Chess" }), "chss")).toBeGreaterThan(0);
    expect(scoreEntry(entry({ title: "Chess" }), "chs")).toBe(0);
  });

  it("ranks an exact match above a typo", () => {
    expect(scoreEntry(entry({ title: "Chess" }), "chess")).toBeGreaterThan(scoreEntry(entry({ title: "Chess" }), "chss"));
  });

  it("puts an exact title first", () => {
    const hits = searchEntries([entry({ id: "long", title: "Notes by path" }), entry({ id: "exact", title: "Notes" })], "notes");
    expect(hits[0].id).toBe("exact");
  });

  it("keeps near ties in their natural order, such as stages on one path", () => {
    const stages = [
      entry({ id: "s3", kind: "stage", title: "Chess endgames", order: 3 }),
      entry({ id: "s1", kind: "stage", title: "Chess openings", order: 1 }),
      entry({ id: "s2", kind: "stage", title: "Chess tactics", order: 2 }),
    ];
    expect(searchEntries(stages, "chess").map((hit) => hit.id)).toEqual(["s1", "s2", "s3"]);
  });

  it("returns nothing for an empty query", () => {
    expect(searchEntries(STATIC_SEARCH, "   ")).toEqual([]);
  });

  it("groups hits in a fixed section order", () => {
    const hits = searchEntries(
      [entry({ id: "n", kind: "niche", title: "Chess" }), entry({ id: "a", kind: "action", title: "Chess timer" }), entry({ id: "s", kind: "stage", title: "Chess openings" })],
      "chess",
    );
    expect(groupHits(hits).map((group) => group.kind)).toEqual(["action", "niche", "stage"]);
  });
});

describe("the static index", () => {
  it("has unique ids, a destination for every entry, and valid suggestions", () => {
    expect(new Set(STATIC_SEARCH.map((item) => item.id)).size).toBe(STATIC_SEARCH.length);
    for (const item of STATIC_SEARCH) expect(Boolean(item.href || item.action), item.id).toBe(true);
    for (const id of SEARCH_SUGGESTIONS) expect(STATIC_SEARCH.some((item) => item.id === id)).toBe(true);
  });

  it.each([
    ["dark mode", "s-appearance"],
    ["accent colour", "s-appearance"],
    ["delete account", "s-delete"],
    ["pomodoro", "f-focus"],
    ["screen time", "p-detox"],
    ["certificate", "f-certificate"],
    ["career", "p-career"],
    ["tutorial", "f-tour"],
  ])("finds %s", (query, id) => {
    expect(searchEntries(STATIC_SEARCH, query, 6).map((hit) => hit.id)).toContain(id);
  });
});
