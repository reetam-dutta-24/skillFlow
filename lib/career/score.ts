import { IPIP_ITEMS, ONET_ITEMS, type Area, type Domain } from "./items";
import { AREA_ORDER, DOMAIN_ORDER, FACETS, PAGE_SIZE, PATH_FIT } from "./meta";

export type CareerAnswers = { ipip: Record<string, number>; onet: Record<string, number> };
export type Band = "low" | "average" | "high";
export type Scale = { raw: number; min: number; max: number; pct: number; band: Band };
export type PathMatch = { slug: string; fit: number; interest: number; trait: number; areas: Area[]; traits: Domain[] };
export type CareerScores = {
  domains: Record<Domain, Scale>;
  facets: Record<string, Scale>;
  areas: Record<Area, Scale>;
  /** The three strongest interest areas, strongest first. Ties keep R-I-A-S-E-C order. */
  code: Area[];
  matches: PathMatch[];
  studyStyle: string[];
};

export const TOTAL_ITEMS = IPIP_ITEMS.length + ONET_ITEMS.length;
export const IPIP_PAGES = Math.ceil(IPIP_ITEMS.length / PAGE_SIZE);
export const TOTAL_PAGES = IPIP_PAGES + Math.ceil(ONET_ITEMS.length / PAGE_SIZE);

const isIpip = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 5;
const isOnet = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 4;

/** Keeps only valid answers to real items, so stored JSON can never carry anything else. */
export function cleanAnswers(raw: unknown): CareerAnswers {
  const source = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<"ipip" | "onet", Record<string, unknown>>>;
  const ipip: Record<string, number> = {};
  const onet: Record<string, number> = {};
  for (const item of IPIP_ITEMS) {
    const value = source.ipip?.[String(item.n)];
    if (isIpip(value)) ipip[String(item.n)] = value;
  }
  for (const item of ONET_ITEMS) {
    const value = source.onet?.[String(item.n)];
    if (isOnet(value)) onet[String(item.n)] = value;
  }
  return { ipip, onet };
}

/** Page n (0-based) holds ten items: pages 0-11 are IPIP, 12-17 are O*NET. */
export function pageItems(page: number) {
  if (page < IPIP_PAGES) return { part: "ipip" as const, items: IPIP_ITEMS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE) };
  const offset = (page - IPIP_PAGES) * PAGE_SIZE;
  return { part: "onet" as const, items: ONET_ITEMS.slice(offset, offset + PAGE_SIZE) };
}

export function progress(answers: CareerAnswers) {
  const answered = Object.keys(answers.ipip).length + Object.keys(answers.onet).length;
  let firstOpenPage = TOTAL_PAGES;
  for (let page = 0; page < TOTAL_PAGES; page += 1) {
    const { part, items } = pageItems(page);
    if (items.some((item) => answers[part][String(item.n)] === undefined)) {
      firstOpenPage = page;
      break;
    }
  }
  return { answered, total: TOTAL_ITEMS, complete: answered === TOTAL_ITEMS, firstOpenPage };
}

function scale(raw: number, min: number, max: number): Scale {
  const pct = Math.round(((raw - min) / (max - min)) * 100);
  return { raw, min, max, pct, band: pct < 35 ? "low" : pct > 65 ? "high" : "average" };
}

/** Plain-code study advice from the trait scores. The report's writing builds on these, never replaces them. */
function studyStyle(domains: Record<Domain, Scale>, facets: Record<string, Scale>) {
  const tips: string[] = [];
  const C = domains.C.band;
  const O5 = facets.O5.band;
  const E = domains.E.band;
  const N = domains.N.band;
  const A = domains.A.band;
  if (C === "high") tips.push("A fixed weekly plan suits you. Set one with a deadline on the path's roadmap and keep to its order.");
  else if (C === "low") tips.push("Short sessions with a clear finish line suit you better than long plans. Aim for one explain-back idea per sitting.");
  else tips.push("A light weekly target works well: one stage a week, with the deadline left open.");
  if (O5 === "high") tips.push("Start each stage with the reading and course resources; you enjoy the theory and it sticks.");
  else if (O5 === "low") tips.push("Start each stage with the video or hands-on resource; the theory lands better after you have tried it.");
  if (E === "high") tips.push("Learn out loud: post to Open Source, join nearby events, and explain ideas to someone else.");
  else if (E === "low") tips.push("Protect quiet, focused time. The explain-back gate is a private way to check yourself without an audience.");
  if (N === "high") tips.push("Take one idea at a time and treat a thin answer as feedback, not failure. Small passes build momentum.");
  else if (N === "low") tips.push("You handle pressure well, so stretch goals and tight deadlines can work for you.");
  if (A === "high") tips.push("Helping others learn suits you; answering questions on Open Source contributions will deepen what you know.");
  else if (A === "low") tips.push("Set your own bar and measure yourself against it; a personal deadline will motivate you more than a group.");
  return tips;
}

export function scoreAnswers(answers: CareerAnswers): CareerScores {
  const facetRaw: Record<string, number> = {};
  for (const item of IPIP_ITEMS) {
    const answer = answers.ipip[String(item.n)] ?? 3;
    facetRaw[item.facet] = (facetRaw[item.facet] ?? 0) + (item.keyed === "+" ? answer : 6 - answer);
  }
  const facets: Record<string, Scale> = {};
  for (const facet of Object.keys(FACETS)) facets[facet] = scale(facetRaw[facet] ?? 12, 4, 20);

  const domains = {} as Record<Domain, Scale>;
  for (const domain of DOMAIN_ORDER) {
    const raw = Object.keys(FACETS)
      .filter((facet) => facet.startsWith(domain))
      .reduce((sum, facet) => sum + (facetRaw[facet] ?? 12), 0);
    domains[domain] = scale(raw, 24, 120);
  }

  const areaRaw = Object.fromEntries(AREA_ORDER.map((area) => [area, 0])) as Record<Area, number>;
  for (const item of ONET_ITEMS) areaRaw[item.area] += answers.onet[String(item.n)] ?? 0;
  const areas = {} as Record<Area, Scale>;
  for (const area of AREA_ORDER) areas[area] = scale(areaRaw[area], 0, 40);

  const code = [...AREA_ORDER].sort((a, b) => areaRaw[b] - areaRaw[a] || AREA_ORDER.indexOf(a) - AREA_ORDER.indexOf(b)).slice(0, 3);

  const matches: PathMatch[] = Object.entries(PATH_FIT)
    .map(([slug, fit]) => {
      const weights = [3, 2, 1];
      const interest = fit.areas.reduce((sum, area, index) => sum + weights[index] * (areaRaw[area] / 40), 0) / 6;
      const trait = fit.traits.length ? fit.traits.reduce((sum, domain) => sum + domains[domain].pct / 100, 0) / fit.traits.length : 0.5;
      return {
        slug,
        fit: Math.round((0.8 * interest + 0.2 * trait) * 100),
        interest: Math.round(interest * 100),
        trait: Math.round(trait * 100),
        areas: [...fit.areas],
        traits: [...fit.traits],
      };
    })
    .sort((a, b) => b.fit - a.fit || b.interest - a.interest || a.slug.localeCompare(b.slug));

  return { domains, facets, areas, code, matches, studyStyle: studyStyle(domains, facets) };
}
