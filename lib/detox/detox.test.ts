import { describe, expect, it } from "vitest";
import { guidanceSchema, readGuidance } from "@/lib/detox/guidance-schema";
import { PLAYBOOK, PLAYBOOK_IDS, rulesPick, settlePicks } from "@/lib/detox/playbook";
import { DETOX_QUESTIONS, type DetoxAnswers } from "@/lib/detox/questions";
import { guidanceRoute, rulesGuidance } from "@/lib/detox/rules-guidance";
import {
  CHECKIN_LIMIT,
  DAILY_CAP,
  RAW_RANGE,
  activityMix,
  answerProgress,
  bandFor,
  baselineScore,
  checkInAdjustment,
  checkInDue,
  clampScore,
  cleanAnswers,
  currentScore,
  dayPoints,
  detoxKpis,
  isDistress,
  scoreTimeline,
  sectionScores,
  weekStartOf,
  weeklyBreakdown,
  weeklySeries,
  type DetoxEvent,
  type DetoxInput,
} from "@/lib/detox/score";
import { detoxCardState } from "@/lib/detox/state";

/** Every question answered with its best (or worst) option. */
function extreme(best: boolean): DetoxAnswers {
  const answers: DetoxAnswers = {};
  for (const question of DETOX_QUESTIONS) {
    if (question.kind === "chips") {
      answers[question.id] = best ? question.options.filter((option) => option.id !== question.noneId).map((option) => option.id) : [question.noneId!];
      continue;
    }
    const sorted = [...question.options].sort((a, b) => a.points - b.points);
    answers[question.id] = (best ? sorted.at(-1) : sorted[0])!.id;
  }
  return answers;
}

const T0 = new Date("2026-10-05T09:00:00.000Z"); // a Monday
const day = (n: number, hour = 12) => new Date(T0.getTime() + n * 86_400_000 + (hour - 9) * 3_600_000);
const base = (events: DetoxEvent[] = [], checkIns: DetoxInput["checkIns"] = []): DetoxInput => ({
  baseline: -20,
  baselineAt: T0,
  baselineScreen: "4-6",
  events,
  checkIns,
});

describe("the question bank", () => {
  it("has 15 to 20 questions with unique ids and options", () => {
    expect(DETOX_QUESTIONS.length).toBeGreaterThanOrEqual(15);
    expect(DETOX_QUESTIONS.length).toBeLessThanOrEqual(20);
    expect(new Set(DETOX_QUESTIONS.map((question) => question.id)).size).toBe(DETOX_QUESTIONS.length);
    for (const question of DETOX_QUESTIONS) {
      expect(new Set(question.options.map((option) => option.id)).size, question.id).toBe(question.options.length);
      expect(question.prompt.trim(), question.id).not.toBe("");
    }
  });

  it("covers screen time, short video, reaching, focus, sleep, offline life, and mood", () => {
    expect(new Set(DETOX_QUESTIONS.map((question) => question.section))).toEqual(
      new Set(["screen", "short-form", "reaching", "focus", "sleep", "offline", "mood"]),
    );
  });
});

describe("baseline mapping", () => {
  it("maps the best answers to +100 and the worst to -100", () => {
    expect(baselineScore(extreme(true))).toBe(100);
    expect(baselineScore(extreme(false))).toBe(-100);
  });

  it("places the raw total linearly between the two", () => {
    const [low, high] = RAW_RANGE;
    expect(high).toBeGreaterThan(low);
    const mixed = { ...extreme(false), screen: "lt1" };
    const expected = Math.round(((low + 26 - low) / (high - low)) * 200 - 100);
    expect(baselineScore(mixed)).toBe(expected);
  });

  it("is deterministic and counts an unanswered question as zero points", () => {
    const answers = extreme(true);
    expect(baselineScore(answers)).toBe(baselineScore({ ...answers }));
    const rest = Object.fromEntries(Object.entries(answers).filter(([id]) => id !== "screen"));
    expect(baselineScore(rest)).toBeLessThan(100);
  });

  it("caps chip points and keeps 'none of these' alone", () => {
    const cleaned = cleanAnswers({ hobbies: ["sport", "none", "books", "bogus"], screen: "nope", mood: "3" });
    expect(cleaned).toEqual({ hobbies: ["sport", "books"], mood: "3" });
    const all = extreme(true).hobbies as string[];
    const sections = sectionScores({ hobbies: all, weekend: "most" });
    expect(sections.offline).toBe(100);
  });

  it("tracks progress through the check", () => {
    expect(answerProgress({})).toMatchObject({ answered: 0, complete: false, firstOpen: 0 });
    expect(answerProgress(extreme(true))).toMatchObject({ complete: true, answered: DETOX_QUESTIONS.length });
  });

  it("clamps to -100..+100", () => {
    expect(clampScore(240)).toBe(100);
    expect(clampScore(-130.6)).toBe(-100);
    expect(clampScore(12.5)).toBe(13);
  });

  it("names a band for every score", () => {
    expect(bandFor(-100).label).toBe("Overstimulated");
    expect(bandFor(-30).label).toBe("Rebalancing");
    expect(bandFor(10).label).toBe("Steady");
    expect(bandFor(50).label).toBe("Deep focus");
    expect(bandFor(100).label).toBe("Deep focus");
  });
});

describe("how the score moves", () => {
  it("starts at the baseline", () => {
    expect(currentScore(base(), day(0))).toBe(-20);
  });

  it("earns points from verified learning plus a consistency bonus", () => {
    const score = currentScore(base([{ at: day(0, 15), kind: "idea" }]), day(0, 18));
    expect(score).toBe(clampScore(-20 + 1 + 0.5));
  });

  it("weights recalls by quality, not count", () => {
    expect(dayPoints([{ at: day(0), kind: "recall", quality: "strong" }]).raw).toBe(1.5);
    expect(dayPoints([{ at: day(0), kind: "recall", quality: "weak" }]).raw).toBeCloseTo(0.7);
  });

  it("caps what one day can add, however long someone grinds", () => {
    const grind = Array.from({ length: 40 }, () => ({ at: day(1, 14), kind: "idea" as const }));
    const points = dayPoints(grind);
    expect(points.capped).toBe(true);
    expect(points.earned).toBe(DAILY_CAP);
    expect(currentScore(base(grind), day(1, 20))).toBe(-20 + DAILY_CAP);
  });

  it("ignores focus sessions under ten minutes and activity before the baseline", () => {
    const events: DetoxEvent[] = [
      { at: day(0, 14), kind: "focus", minutes: 6 },
      { at: new Date(T0.getTime() - 3_600_000), kind: "stage" },
    ];
    expect(currentScore(base(events), day(0, 20))).toBe(-20);
    expect(dayPoints([{ at: day(0), kind: "focus", minutes: 50 }]).raw).toBe(2.5);
  });

  it("eases progress back toward the baseline after a quiet week, gently", () => {
    const events: DetoxEvent[] = Array.from({ length: 4 }, (_, index) => ({ at: day(index, 14), kind: "stage" as const }));
    const active = currentScore(base(events), day(3, 20));
    expect(active).toBe(-20 + 4 * 2.5);
    const later = scoreTimeline(base(events), day(10, 20));
    expect(later.at(-1)?.score).toBe(clampScore(-20 + 10 * 0.9));
    expect(later.some((snapshot) => snapshot.decayed)).toBe(true);
    // Never below the starting point: decay only shrinks what was earned.
    expect(currentScore(base(events), day(200, 20))).toBeGreaterThanOrEqual(-20);
  });

  it("nudges with the weekly check-in, within limits, from the latest check-in only", () => {
    expect(checkInAdjustment({ screenBand: "1-2", focus: 4 }, "4-6")).toBe(Math.round(14 * 0.5 + 1.5));
    expect(checkInAdjustment({ screenBand: "lt1", focus: 5 }, "6plus")).toBe(CHECKIN_LIMIT);
    expect(checkInAdjustment({ screenBand: "6plus", focus: 1 }, "lt1")).toBe(-CHECKIN_LIMIT);
    const checkIns = [
      { weekStart: "2026-10-05", screenBand: "1-2" as const, focus: 4, at: day(1) },
      { weekStart: "2026-10-12", screenBand: "4-6" as const, focus: 3, at: day(8) },
    ];
    expect(currentScore(base([], checkIns), day(2))).toBe(-20 + 9);
    expect(currentScore(base([], checkIns), day(9))).toBe(-20);
  });

  it("gives the same score for the same inputs", () => {
    const input = base([{ at: day(1), kind: "idea" }, { at: day(2), kind: "recall", quality: "partial" }]);
    expect(currentScore(input, day(5))).toBe(currentScore(input, day(5)));
  });
});

describe("the weekly breakdown", () => {
  it("explains the change in words", () => {
    const events: DetoxEvent[] = [
      ...Array.from({ length: 9 }, (_, index) => ({ at: day(8 + (index % 3), 10 + index), kind: "idea" as const })),
      ...[8, 9, 10, 11].map((n) => ({ at: day(n, 9), kind: "focus" as const, minutes: 25 })),
    ];
    const checkIns = [{ weekStart: "2026-10-12", screenBand: "2-4" as const, focus: 4, at: day(11) }];
    const breakdown = weeklyBreakdown(base(events, checkIns), day(12, 20));
    expect(breakdown.parts).toContain("9 ideas passed");
    expect(breakdown.parts).toContain("4 focused days");
    expect(breakdown.parts).toContain("screen time down 2 h");
    expect(breakdown.summary.startsWith(`+${breakdown.change} this week: 9 ideas passed`)).toBe(true);
    expect(breakdown.change).toBe(breakdown.score - breakdown.previous);
  });

  it("says when nothing has happened yet", () => {
    expect(weeklyBreakdown(base(), day(2)).summary).toMatch(/No change yet this week/);
  });

  it("explains a quiet-week ease-back without blame", () => {
    const breakdown = weeklyBreakdown(base([{ at: day(0, 14), kind: "stage" }]), day(9, 20));
    expect(breakdown.decayed).toBe(true);
    expect(breakdown.summary).toMatch(/quiet week/);
    expect(breakdown.summary).not.toMatch(/fail|lazy|bad/i);
  });

  it("totals, weekly series, and mix come from the same events", () => {
    const events: DetoxEvent[] = [
      { at: day(1), kind: "idea" },
      { at: day(1), kind: "recall", quality: "strong" },
      { at: day(8), kind: "focus", minutes: 30 },
    ];
    const kpis = detoxKpis(base(events), day(9));
    expect(kpis).toMatchObject({ daysActive: 2, ideasPassed: 1, focusedMinutes: 30, averageRecall: 100, screenFrom: "4-6", screenTo: null });
    const weeks = weeklySeries(base(events), day(9));
    expect(weeks.map((week) => week.weekStart)).toEqual(["2026-10-05", "2026-10-12"]);
    expect(weeks[1].focusMinutes).toBe(30);
    expect(activityMix(base(events), day(9)).map((row) => row.kind)).toEqual(["idea", "recall", "focus"]);
  });
});

describe("the weekly check-in reminder", () => {
  it("is due six days after the baseline when this week has no check-in", () => {
    expect(weekStartOf(new Date("2026-10-18T10:00:00Z"))).toBe("2026-10-12");
    expect(checkInDue({ completedAt: T0, checkInWeeks: [], now: day(3) })).toBe(false);
    expect(checkInDue({ completedAt: T0, checkInWeeks: [], now: day(7) })).toBe(true);
    expect(checkInDue({ completedAt: T0, checkInWeeks: ["2026-10-12"], now: day(8) })).toBe(false);
    expect(checkInDue({ completedAt: null, checkInWeeks: [], now: day(8) })).toBe(false);
  });
});

describe("guidance", () => {
  const answers = { ...extreme(true), "short-video": "2h", "scroll-stop": "never", intent: "sleep" };

  it("picks three steps from three areas, the stated intent first", () => {
    const picks = rulesPick(answers, sectionScores(answers));
    expect(picks).toHaveLength(3);
    expect(new Set(picks).size).toBe(3);
    for (const id of picks) expect(PLAYBOOK_IDS.has(id)).toBe(true);
    expect(PLAYBOOK.find((step) => step.id === picks[0])?.area).toBe("sleep");
    expect(PLAYBOOK.find((step) => step.id === picks[1])?.area).toBe("short-form");
  });

  it("keeps only real playbook ids from the model and tops up from the rules", () => {
    const fallback = rulesPick(answers, sectionScores(answers));
    expect(settlePicks(["phone-other-room", "made-up", "phone-other-room"], fallback)).toEqual(
      [...new Set(["phone-other-room", ...fallback])].slice(0, 3),
    );
    expect(settlePicks(undefined, fallback)).toEqual(fallback);
  });

  it("parses a model reply leniently and rejects one without a narrative", () => {
    const ok = guidanceSchema.safeParse({ narrative: "x".repeat(900), steps: ["timebox-25", { id: "grayscale" }, 7] });
    expect(ok.success && ok.data.narrative.length).toBe(700);
    expect(ok.success && ok.data.steps).toEqual(["timebox-25", "grayscale"]);
    expect(guidanceSchema.safeParse({ steps: ["timebox-25"] }).success).toBe(false);
    expect(readGuidance({ narrative: "Hello", steps: ["a"], source: "model" })).toEqual({ narrative: "Hello", steps: ["a"], source: "model" });
    expect(readGuidance(null)).toBeNull();
  });

  it("writes rules guidance that never states a different number", () => {
    const guidance = rulesGuidance({ answers, baseline: -10, score: 4, sections: sectionScores(answers), week: null });
    expect(guidance.source).toBe("rules");
    expect(guidance.steps).toHaveLength(3);
    expect(guidance.narrative).toContain("from -10 to 4");
    expect(guidance.narrative).not.toMatch(/dopamine level/i);
  });
});

describe("the distress branch", () => {
  it("is triggered by very low mood or overwhelm nearly every day", () => {
    expect(isDistress({ mood: "1" })).toBe(true);
    expect(isDistress({ overwhelm: "always" })).toBe(true);
    expect(isDistress({ mood: "2", overwhelm: "often" })).toBe(false);
  });

  it("shows support and never calls a model", () => {
    expect(guidanceRoute({ distress: true, hasModel: true, allowed: true })).toBe("support");
    expect(guidanceRoute({ distress: false, hasModel: true, allowed: true })).toBe("model");
    expect(guidanceRoute({ distress: false, hasModel: true, allowed: false })).toBe("rules");
    expect(guidanceRoute({ distress: false, hasModel: false, allowed: true })).toBe("rules");
  });
});

describe("the Home card state rule", () => {
  it("invites, resumes, supports, or shows the score", () => {
    expect(detoxCardState({ status: "none", distress: false })).toBe("invite");
    expect(detoxCardState({ status: "in-progress", distress: false })).toBe("resume");
    expect(detoxCardState({ status: "complete", distress: true })).toBe("support");
    expect(detoxCardState({ status: "complete", distress: false })).toBe("score");
  });
});
