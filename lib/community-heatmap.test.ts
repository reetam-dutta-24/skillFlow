import { describe, expect, it } from "vitest";
import { buildHeatmap, dayLabel } from "@/lib/community-heatmap";

describe("contribution heatmap", () => {
  it("covers a year in full weeks that start on Sunday and end today", () => {
    const map = buildHeatmap(new Map(), new Date("2026-10-01T12:00:00Z"));
    expect(map.weeks[0][0].day).toBe("2025-09-28");
    const lastWeek = map.weeks[map.weeks.length - 1];
    expect(lastWeek[lastWeek.length - 1].day).toBe("2026-10-01");
    expect(map.weeks.slice(0, -1).every((week) => week.length === 7)).toBe(true);
    expect(map.total).toBe(0);
    expect(map.summary).toBe("No merged contributions in the last 12 months.");
  });

  it("labels each day and counts the window", () => {
    const counts = new Map([
      ["2026-09-12", 3],
      ["2026-09-13", 1],
      ["2024-01-01", 9],
    ]);
    const map = buildHeatmap(counts, new Date("2026-10-01T00:00:00Z"));
    const cell = map.weeks.flat().find((item) => item.day === "2026-09-12");
    expect(cell?.label).toBe("3 contributions on 12 Sep 2026");
    expect(cell?.level).toBe(4);
    expect(map.total).toBe(4);
    expect(map.activeDays).toBe(2);
    expect(dayLabel("2026-09-13")).toBe("13 Sep 2026");
  });
});
