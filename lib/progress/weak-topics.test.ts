import { describe, expect, it } from "vitest";
import { ideaKey, rankWeakTopics, type WeakStage } from "./weak-topics";

const stages = new Map<string, WeakStage>([
  ["s1", { id: "s1", title: "How the web works", image: "/stages/web/1.jpg", skillSlug: "web", skillName: "Web" }],
  ["s2", { id: "s2", title: "Semantic HTML", image: null, skillSlug: "web", skillName: "Web" }],
]);
const day = (n: number) => new Date(Date.UTC(2026, 9, n));

describe("rankWeakTopics", () => {
  it("puts an idea that is still not passed first, with the latest review", () => {
    const topics = rankWeakTopics({
      misses: [
        { stageId: "s1", concept: "DNS", review: "Older review", at: day(1) },
        { stageId: "s1", concept: "DNS", review: "Newer review", at: day(2) },
        { stageId: "s2", concept: "Landmarks", review: "Took a while", at: day(3) },
        { stageId: "s2", concept: "Landmarks", review: "Second miss", at: day(4) },
      ],
      recalls: [],
      passedIdeas: new Set([ideaKey("s2", "Landmarks")]),
      passedStages: new Set(),
      stages,
    });
    expect(topics.map((topic) => [topic.concept, topic.status])).toEqual([
      ["DNS", "open"],
      ["Landmarks", "retried"],
    ]);
    expect(topics[0]).toMatchObject({ misses: 2, reason: "Newer review", href: "/milestone/s1", severity: "high", accuracy: 0 });
    expect(topics[1].href).toBe("/lesson/s2");
  });

  it("drops a single slip that later passed", () => {
    const topics = rankWeakTopics({
      misses: [{ stageId: "s1", concept: "DNS", review: "Missed once", at: day(1) }],
      recalls: [],
      passedIdeas: new Set([ideaKey("s1", "dns")]),
      passedStages: new Set(),
      stages,
    });
    expect(topics).toEqual([]);
  });

  it("uses only the latest recall on an idea", () => {
    const base = { stageId: "s1", concept: "Packets" };
    const cleared = rankWeakTopics({
      misses: [],
      recalls: [
        { ...base, quality: "weak", review: "Weak", at: day(1) },
        { ...base, quality: "strong", review: "Strong", at: day(2) },
      ],
      passedIdeas: new Set([ideaKey("s1", "Packets")]),
      passedStages: new Set(["s1"]),
      stages,
    });
    expect(cleared).toEqual([]);

    const slipped = rankWeakTopics({
      misses: [],
      recalls: [
        { ...base, quality: "strong", review: "Strong", at: day(1) },
        { ...base, quality: "partial", review: "Half of it", at: day(2) },
      ],
      passedIdeas: new Set([ideaKey("s1", "Packets")]),
      passedStages: new Set(["s1"]),
      stages,
    });
    expect(slipped).toHaveLength(1);
    expect(slipped[0]).toMatchObject({ status: "recall", reason: "Half of it", accuracy: 0.55 });
  });

  it("names an older whole-stage miss after the stage until the stage passes", () => {
    const miss = { stageId: "s2", concept: null, review: "Not yet", at: day(1) };
    const open = rankWeakTopics({ misses: [miss], recalls: [], passedIdeas: new Set(), passedStages: new Set(), stages });
    expect(open[0]).toMatchObject({ concept: "Semantic HTML", status: "open" });
    const passed = rankWeakTopics({ misses: [miss], recalls: [], passedIdeas: new Set(), passedStages: new Set(["s2"]), stages });
    expect(passed).toEqual([]);
  });

  it("skips stages it cannot describe and respects the limit", () => {
    const topics = rankWeakTopics({
      misses: [
        { stageId: "gone", concept: "X", review: "r", at: day(1) },
        { stageId: "s1", concept: "A", review: "r", at: day(1) },
        { stageId: "s1", concept: "B", review: "r", at: day(2) },
      ],
      recalls: [],
      passedIdeas: new Set(),
      passedStages: new Set(),
      stages,
      limit: 1,
    });
    expect(topics.map((topic) => topic.concept)).toEqual(["B"]);
  });
});
