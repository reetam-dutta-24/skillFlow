import { describe, expect, it } from "vitest";
import { IPIP_ITEMS, ONET_ITEMS } from "./items";
import { FACETS, PATH_FIT } from "./meta";
import { FREE_PATH_SLUGS } from "@/lib/niches/tiers";
import { cleanAnswers, pageItems, progress, scoreAnswers, TOTAL_ITEMS, TOTAL_PAGES } from "./score";

function allAnswers(ipip: (n: number) => number, onet: (n: number) => number) {
  return {
    ipip: Object.fromEntries(IPIP_ITEMS.map((item) => [String(item.n), ipip(item.n)])),
    onet: Object.fromEntries(ONET_ITEMS.map((item) => [String(item.n), onet(item.n)])),
  };
}

describe("career-fit question bank", () => {
  it("has the published shape: 120 IPIP items in 30 facets of 4, 60 O*NET items in 6 areas of 10", () => {
    expect(IPIP_ITEMS).toHaveLength(120);
    expect(ONET_ITEMS).toHaveLength(60);
    for (const facet of Object.keys(FACETS)) expect(IPIP_ITEMS.filter((item) => item.facet === facet)).toHaveLength(4);
    for (const area of ["R", "I", "A", "S", "E", "C"]) expect(ONET_ITEMS.filter((item) => item.area === area)).toHaveLength(10);
    expect(IPIP_ITEMS.filter((item) => item.keyed === "+")).toHaveLength(65);
  });

  it("maps every free path, and only free paths", () => {
    expect(Object.keys(PATH_FIT).sort()).toEqual([...FREE_PATH_SLUGS].sort());
  });
});

describe("career-fit scoring", () => {
  it("reverse-scores negatively keyed items", () => {
    // Answering 5 everywhere: positive items score 5, negative items score 1.
    const scores = scoreAnswers(allAnswers(() => 5, () => 4));
    // C6 Cautiousness is four negatively keyed items.
    expect(scores.facets.C6.raw).toBe(4);
    // N1 Anxiety is four positively keyed items.
    expect(scores.facets.N1.raw).toBe(20);
  });

  it("keeps every scale inside its published range", () => {
    const scores = scoreAnswers(allAnswers((n) => (n % 5) + 1, (n) => n % 5));
    for (const facet of Object.values(scores.facets)) expect(facet.raw).toBeGreaterThanOrEqual(4);
    for (const facet of Object.values(scores.facets)) expect(facet.raw).toBeLessThanOrEqual(20);
    for (const domain of Object.values(scores.domains)) expect(domain.raw).toBeGreaterThanOrEqual(24);
    for (const domain of Object.values(scores.domains)) expect(domain.raw).toBeLessThanOrEqual(120);
    for (const area of Object.values(scores.areas)) expect(area.raw).toBeLessThanOrEqual(40);
  });

  it("builds the interest code from the strongest areas and ranks matching paths first", () => {
    const artistic = new Set(ONET_ITEMS.filter((item) => item.area === "A").map((item) => item.n));
    const social = new Set(ONET_ITEMS.filter((item) => item.area === "S").map((item) => item.n));
    const scores = scoreAnswers(allAnswers(() => 3, (n) => (artistic.has(n) ? 4 : social.has(n) ? 1 : 0)));
    expect(scores.code.slice(0, 2)).toEqual(["A", "S"]);
    expect(scores.areas.A.raw).toBe(40);
    expect(PATH_FIT[scores.matches[0].slug].areas[0]).toBe("A");
    expect(scores.matches).toHaveLength(30);
  });
});

describe("career-fit progress", () => {
  it("drops invalid answers and finds the first page with a gap", () => {
    const answers = cleanAnswers({ ipip: { "1": 3, "2": 9, "999": 4 }, onet: { "1": -1 } });
    expect(answers.ipip).toEqual({ "1": 3 });
    expect(answers.onet).toEqual({});
    expect(progress(answers).firstOpenPage).toBe(0);
    const full = allAnswers(() => 2, () => 2);
    expect(progress(full)).toMatchObject({ answered: TOTAL_ITEMS, complete: true, firstOpenPage: TOTAL_PAGES });
  });

  it("pages through IPIP then O*NET, ten at a time", () => {
    expect(TOTAL_PAGES).toBe(18);
    expect(pageItems(0).part).toBe("ipip");
    expect(pageItems(11).items.at(-1)?.n).toBe(120);
    expect(pageItems(12)).toMatchObject({ part: "onet" });
    expect(pageItems(17).items).toHaveLength(10);
  });
});
