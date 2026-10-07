import type { Area, Domain } from "./items";

/** Version stored with every result, so a later change to scoring or the path table is visible. */
export const CAREER_TEST_VERSION = "ipip-neo-120+onet-ip-sf-60/v1";

export const IPIP_SCALE = [
  { value: 1, label: "Very inaccurate" },
  { value: 2, label: "Moderately inaccurate" },
  { value: 3, label: "Neither" },
  { value: 4, label: "Moderately accurate" },
  { value: 5, label: "Very accurate" },
] as const;

/** The O*NET web version's five-point scale, scored 0 to 4 (Rounds, Su, Lewis, & Rivkin, 2010). */
export const ONET_SCALE = [
  { value: 0, label: "Strongly dislike" },
  { value: 1, label: "Dislike" },
  { value: 2, label: "Unsure" },
  { value: 3, label: "Like" },
  { value: 4, label: "Strongly like" },
] as const;

export const IPIP_INSTRUCTIONS =
  "Each phrase describes a way people behave. Choose how accurately it describes you as you generally are now, not as you wish to be. Compare yourself with people you know of roughly your age. Your answers stay private.";

export const ONET_INSTRUCTIONS =
  "Each line is a work activity. Choose how you would feel about doing it. Don't think about how much education or training it needs, or how much money it would pay.";

export const PAGE_SIZE = 10;

export const DOMAINS: Record<Domain, { name: string; high: string; low: string }> = {
  O: {
    name: "Openness to experience",
    high: "Curious, imaginative, drawn to new ideas, art, and variety.",
    low: "Practical and grounded; prefers the familiar and the concrete.",
  },
  C: {
    name: "Conscientiousness",
    high: "Organised, dependable, and persistent; plans and follows through.",
    low: "Flexible and spontaneous; works in bursts and dislikes rigid plans.",
  },
  E: {
    name: "Extraversion",
    high: "Energised by people and activity; outgoing and assertive.",
    low: "Reserved and independent; recharges alone and prefers depth over breadth.",
  },
  A: {
    name: "Agreeableness",
    high: "Warm, cooperative, and considerate of others.",
    low: "Direct, competitive, and sceptical; puts the task before harmony.",
  },
  N: {
    name: "Neuroticism",
    high: "Feels stress, worry, and setbacks strongly.",
    low: "Calm and steady under pressure; recovers quickly.",
  },
};

/** The 30 facets of the IPIP-NEO, four items each (Johnson, 2014). */
export const FACETS: Record<string, { name: string; about: string }> = {
  N1: { name: "Anxiety", about: "How often you worry or feel nervous." },
  N2: { name: "Anger", about: "How quickly frustration turns into irritation." },
  N3: { name: "Depression", about: "How often you feel low or discouraged." },
  N4: { name: "Self-consciousness", about: "How uneasy you feel in social situations." },
  N5: { name: "Immoderation", about: "How hard it is to resist cravings and urges." },
  N6: { name: "Vulnerability", about: "How much pressure unsettles you." },
  E1: { name: "Friendliness", about: "How easily you warm to people." },
  E2: { name: "Gregariousness", about: "How much you enjoy crowds and company." },
  E3: { name: "Assertiveness", about: "How readily you take charge and speak up." },
  E4: { name: "Activity level", about: "How busy and fast-paced you like life." },
  E5: { name: "Excitement-seeking", about: "How much you seek thrills and stimulation." },
  E6: { name: "Cheerfulness", about: "How often you feel joy and enthusiasm." },
  O1: { name: "Imagination", about: "How much you live in ideas and daydreams." },
  O2: { name: "Artistic interests", about: "How much art and beauty move you." },
  O3: { name: "Emotionality", about: "How aware you are of your own feelings." },
  O4: { name: "Adventurousness", about: "How much you like change and new things." },
  O5: { name: "Intellect", about: "How much you enjoy abstract ideas and challenging material." },
  O6: { name: "Liberalism", about: "How readily you question convention and authority." },
  A1: { name: "Trust", about: "How much you assume good intentions in others." },
  A2: { name: "Morality", about: "How straightforward and fair you are with people." },
  A3: { name: "Altruism", about: "How much you like helping others." },
  A4: { name: "Cooperation", about: "How much you avoid conflict and confrontation." },
  A5: { name: "Modesty", about: "How little you put yourself forward." },
  A6: { name: "Sympathy", about: "How much others' hardship affects you." },
  C1: { name: "Self-efficacy", about: "How capable you feel of getting things done." },
  C2: { name: "Orderliness", about: "How much you like things neat and in order." },
  C3: { name: "Dutifulness", about: "How strongly you keep promises and rules." },
  C4: { name: "Achievement-striving", about: "How hard you push toward excellence." },
  C5: { name: "Self-discipline", about: "How well you start and finish tasks without a push." },
  C6: { name: "Cautiousness", about: "How carefully you think before acting." },
};

/** Holland's six interest areas, as measured by the O*NET Interest Profiler. */
export const AREAS: Record<Area, { name: string; about: string }> = {
  R: { name: "Realistic", about: "Hands-on work with tools, machines, materials, plants, or animals." },
  I: { name: "Investigative", about: "Ideas, research, and solving problems by thinking them through." },
  A: { name: "Artistic", about: "Creating, designing, performing, and self-expression." },
  S: { name: "Social", about: "Helping, teaching, and working with people." },
  E: { name: "Enterprising", about: "Leading, persuading, selling, and starting things." },
  C: { name: "Conventional", about: "Data, detail, order, and clear procedures." },
};

export const AREA_ORDER: Area[] = ["R", "I", "A", "S", "E", "C"];
export const DOMAIN_ORDER: Domain[] = ["O", "C", "E", "A", "N"];

/**
 * SkillFlow's own map from each free path to Holland areas (strongest first) and the traits that help on it.
 * Informed by the O*NET interest profiles of related occupations; it is a guide for recommendations, not an
 * O*NET product. `traits` are Big Five domains whose higher scores make the path easier to sustain.
 */
export const PATH_FIT: Record<string, { areas: [Area, Area, Area]; traits: Domain[] }> = {
  "full-stack-web-dev": { areas: ["I", "C", "R"], traits: ["C", "O"] },
  "travel-vlogging": { areas: ["A", "E", "S"], traits: ["E", "O"] },
  "content-creation": { areas: ["A", "E", "S"], traits: ["E", "O"] },
  "music-production": { areas: ["A", "R", "I"], traits: ["O", "C"] },
  "self-grooming": { areas: ["S", "A", "R"], traits: ["C"] },
  animation: { areas: ["A", "R", "I"], traits: ["O", "C"] },
  "iot-robot-automation": { areas: ["R", "I", "C"], traits: ["C", "O"] },
  screenwriting: { areas: ["A", "I", "E"], traits: ["O"] },
  "graphic-design": { areas: ["A", "R", "E"], traits: ["O"] },
  seo: { areas: ["E", "C", "I"], traits: ["C"] },
  "ai-tools": { areas: ["I", "C", "E"], traits: ["O", "C"] },
  cybersecurity: { areas: ["I", "C", "R"], traits: ["C"] },
  "digital-marketing": { areas: ["E", "A", "C"], traits: ["E", "O"] },
  "personal-finance": { areas: ["C", "E", "I"], traits: ["C"] },
  "public-speaking": { areas: ["E", "S", "A"], traits: ["E"] },
  "sound-design": { areas: ["A", "R", "I"], traits: ["O", "C"] },
  nutrition: { areas: ["I", "S", "R"], traits: ["C"] },
  psychology: { areas: ["I", "S", "A"], traits: ["O", "A"] },
  podcasting: { areas: ["A", "E", "S"], traits: ["E", "O"] },
  guitar: { areas: ["A", "R", "E"], traits: ["O", "C"] },
  chess: { areas: ["I", "C", "E"], traits: ["C", "O"] },
  "art-painting": { areas: ["A", "R", "I"], traits: ["O"] },
  photography: { areas: ["A", "R", "E"], traits: ["O"] },
  "emergency-preparedness": { areas: ["R", "S", "C"], traits: ["C"] },
  badminton: { areas: ["R", "E", "S"], traits: ["E", "C"] },
  relationships: { areas: ["S", "A", "E"], traits: ["A"] },
  socializing: { areas: ["S", "E", "A"], traits: ["E", "A"] },
  "interior-design": { areas: ["A", "E", "R"], traits: ["O"] },
  freelancing: { areas: ["E", "C", "A"], traits: ["C", "E"] },
  "travel-planning": { areas: ["E", "C", "S"], traits: ["C", "O"] },
};

export const SOURCES = {
  ipip:
    "Personality: IPIP-NEO-120, Johnson, J. A. (2014), Journal of Research in Personality, 51, 78–89. Items from the International Personality Item Pool (ipip.ori.org), public domain.",
  onet:
    "Interests: O*NET® Interest Profiler Short Form by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), used under the Creative Commons Attribution 4.0 International License. O*NET® is a trademark of USDOL/ETA. USDOL/ETA has not approved, endorsed, or tested this use.",
  note:
    "This is a self-discovery tool, not a clinical or psychological assessment, and not career counselling. Scores show where your own answers fall on each scale; they are not compared with a population.",
};
