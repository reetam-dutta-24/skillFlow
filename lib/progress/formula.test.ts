import { describe, expect, it } from "vitest";
import {
  masteryAt,
  masteryShare,
  recentMonths,
  stageCountsAsOpen,
  streakFromDays,
  streakReminderDue,
  utcDay,
  weekChecks,
} from "@/lib/progress/formula";

const now = new Date("2026-10-06T18:00:00.000Z");

describe("mastery share", () => {
  it("is passed open stages over the stages a learner can open", () => {
    expect(masteryShare(3, 7)).toBe(43);
    expect(masteryShare(1, 9)).toBe(11);
    expect(masteryShare(0, 7)).toBe(0);
    expect(masteryShare(0, 0)).toBe(0);
  });
});

describe("open stages", () => {
  const base = { skillStatus: "AVAILABLE", skillOffer: "FREE", monetized: false, stageCount: 12 };

  it("counts every stage on a free path, including the last three", () => {
    expect(stageCountsAsOpen({ ...base, order: 9 })).toBe(true);
    expect(stageCountsAsOpen({ ...base, order: 10 })).toBe(true);
    expect(stageCountsAsOpen({ ...base, order: 12 })).toBe(true);
  });

  it("opens nothing on a coming-soon or monetized path", () => {
    expect(stageCountsAsOpen({ ...base, skillStatus: "COMING_SOON", order: 1 })).toBe(false);
    expect(stageCountsAsOpen({ ...base, skillOffer: "MONETIZED", order: 1 })).toBe(false);
    expect(stageCountsAsOpen({ ...base, monetized: true, order: 1 })).toBe(false);
  });

  it("opens every stage when a path has one or two", () => {
    expect(stageCountsAsOpen({ ...base, stageCount: 1, order: 1 })).toBe(true);
    expect(stageCountsAsOpen({ ...base, stageCount: 2, order: 1 })).toBe(true);
    expect(stageCountsAsOpen({ ...base, stageCount: 2, order: 2 })).toBe(true);
  });
});

describe("streaks", () => {
  it("counts a run that reaches today or yesterday, and keeps the longest run", () => {
    expect(streakFromDays([], "2026-10-06")).toEqual({ current: 0, longest: 0 });
    expect(streakFromDays(["2026-10-06", "2026-10-06"], "2026-10-06")).toEqual({ current: 1, longest: 1 });
    expect(streakFromDays(["2026-10-05"], "2026-10-06")).toEqual({ current: 1, longest: 1 });
    expect(streakFromDays(["2026-10-04", "2026-10-05", "2026-10-06"], "2026-10-06")).toEqual({ current: 3, longest: 3 });
    expect(streakFromDays(["2026-10-01", "2026-10-02", "2026-10-05"], "2026-10-06")).toEqual({ current: 1, longest: 2 });
    expect(streakFromDays(["2026-10-01"], "2026-10-06")).toEqual({ current: 0, longest: 1 });
    expect(streakReminderDue({ enabled: true, lastDay: "2026-10-05", today: "2026-10-06" })).toBe(true);
    expect(streakReminderDue({ enabled: true, lastDay: "2026-10-06", today: "2026-10-06" })).toBe(false);
    expect(streakReminderDue({ enabled: false, lastDay: "2026-10-05", today: "2026-10-06" })).toBe(false);
  });
});

describe("charts", () => {
  it("places a pass in the month it happened, and leaves earlier months at zero", () => {
    const months = recentMonths(now);
    expect(months).toHaveLength(6);
    expect(months[5]?.label).toBe("Oct");
    expect(months[0]?.label).toBe("May");
    const passed = new Map([["css", new Date("2026-10-05T10:00:00.000Z")]]);
    expect(masteryAt(["css", "js"], passed, months[4].end)).toBe(0);
    expect(masteryAt(["css", "js"], passed, months[5].end)).toBe(50);
    expect(masteryAt(["locked"], passed, months[5].end)).toBe(0);
  });

  it("counts explain-backs on their UTC day and leaves the other days at zero", () => {
    const bars = weekChecks([new Date("2026-10-06T01:00:00.000Z"), new Date("2026-10-06T20:00:00.000Z")], now);
    expect(bars).toHaveLength(7);
    expect(bars.map((bar) => bar.day)).toEqual(["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"]);
    expect(bars[6]).toEqual({ day: "Tue", checks: 2 });
    expect(bars.slice(0, 6).every((bar) => bar.checks === 0)).toBe(true);
    expect(utcDay(now)).toBe("2026-10-06");
  });
});
