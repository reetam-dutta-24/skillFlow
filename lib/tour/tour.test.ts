import { describe, expect, it } from "vitest";
import {
  BEYOND_START,
  BEYOND_TILES,
  PROGRESS_START,
  SAMPLE_NOTE,
  allBeyondSeen,
  demoMastery,
  formatMinutes,
  passDemoStage,
  planWeek,
  practiceNote,
  reviewPracticeAnswer,
  tapPathStage,
  toggleBeyondTile,
  weeklyMinutes,
} from "@/lib/tour/demos";
import { tourEntry, tourStartLabel, tourStartTarget } from "@/lib/tour/entry";
import { START_ON_PATH, START_WITHOUT_PATH, TOUR_BODY_MAX_WORDS, TOUR_SLIDES, wordCount } from "@/lib/tour/slides";

describe("tour slides", () => {
  it("has nine slides in the agreed order", () => {
    expect(TOUR_SLIDES.map((slide) => slide.id)).toEqual([
      "welcome",
      "paths",
      "explain-back",
      "notes",
      "progress",
      "make-it-yours",
      "beyond",
      "premium",
      "start",
    ]);
  });

  it("gives every slide a heading, a body, a visual and a dot label", () => {
    for (const slide of TOUR_SLIDES) {
      expect(slide.heading.trim(), slide.id).not.toBe("");
      expect(slide.body.trim(), slide.id).not.toBe("");
      expect(slide.visual, slide.id).toBeTruthy();
      expect(slide.label.trim(), slide.id).not.toBe("");
    }
  });

  it("keeps ids unique and body copy short", () => {
    expect(new Set(TOUR_SLIDES.map((slide) => slide.id)).size).toBe(TOUR_SLIDES.length);
    for (const slide of TOUR_SLIDES) expect(wordCount(slide.body), slide.id).toBeLessThanOrEqual(TOUR_BODY_MAX_WORDS);
    expect(wordCount(START_WITHOUT_PATH.body)).toBeLessThanOrEqual(TOUR_BODY_MAX_WORDS);
    expect(wordCount(START_ON_PATH.body)).toBeLessThanOrEqual(TOUR_BODY_MAX_WORDS);
  });

  it("puts a demo on every feature slide and none on welcome, premium or start", () => {
    const withDemo = TOUR_SLIDES.filter((slide) => slide.demo).map((slide) => slide.id);
    expect(withDemo).toEqual(["paths", "explain-back", "notes", "progress", "make-it-yours", "beyond"]);
    for (const slide of TOUR_SLIDES) if (slide.demo) expect(slide.demo.prompt.trim(), slide.id).not.toBe("");
  });

  it("uses at most one emoji per heading and no exclamation marks", () => {
    for (const slide of TOUR_SLIDES) {
      expect(slide.heading).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(`${slide.heading} ${slide.body}`).not.toContain("!");
    }
  });

  it("says the explain-back practice is not the real AI", () => {
    const explain = TOUR_SLIDES.find((slide) => slide.id === "explain-back");
    expect(explain?.demo?.prompt).toMatch(/not the real AI/);
  });
});

describe("path demo", () => {
  it("opens the first stage and explains every lock", () => {
    expect(tapPathStage(0).kind).toBe("open");
    expect(tapPathStage(1)).toEqual({ kind: "locked", message: "Pass stage 1 to open this one." });
    expect(tapPathStage(2)).toEqual({ kind: "locked", message: "Pass stage 2 to open this one." });
  });
});

describe("explain-back practice rule", () => {
  it("asks for something when the box is empty", () => {
    expect(reviewPracticeAnswer("   ").verdict).toBe("empty");
  });

  it("keeps a very short answer on the idea", () => {
    const review = reviewPracticeAnswer("It stores a value because yes.");
    expect(review).toMatchObject({ verdict: "stay", reason: "short", title: "Stay with this idea" });
  });

  it("keeps a full answer without a reason on the idea", () => {
    const review = reviewPracticeAnswer("A variable is a named place in memory that holds a value");
    expect(review).toMatchObject({ verdict: "stay", reason: "no-reason" });
  });

  it.each([
    "A variable is a name for a value, so you can reuse it later in the code.",
    "A variable holds a value because the program needs to remember it for later.",
    "You make a variable when you need to keep a number around for later steps.",
    "A variable is a labelled box that is used to keep data while the program runs.",
    "BECAUSE values change, a variable gives them one stable name in the code.",
  ])("lets a fuller answer with a reason hold: %s", (answer) => {
    expect(reviewPracticeAnswer(answer)).toMatchObject({ verdict: "holds", title: "This idea holds" });
  });

  it("matches reason words as whole words only", () => {
    // "also", "whence" and "user to" must not count as "so", "when" or "used to".
    expect(reviewPracticeAnswer("A variable is also a name whence a user to store data values").verdict).toBe("stay");
  });
});

describe("notes demo", () => {
  it("uses the practice answer when it held", () => {
    const answer = "A variable is a name for a value, so you can reuse it later.";
    expect(practiceNote(answer)).toEqual({ text: answer, fromAnswer: true });
  });

  it("falls back to the sample when there is no answer or it did not hold", () => {
    expect(practiceNote(null)).toEqual({ text: SAMPLE_NOTE, fromAnswer: false });
    expect(practiceNote("a box")).toEqual({ text: SAMPLE_NOTE, fromAnswer: false });
  });

  it("shortens a long answer on a word boundary", () => {
    const long = `A variable is a name for a value so ${"you can use it again and again ".repeat(12)}`;
    const note = practiceNote(long);
    expect(note.fromAnswer).toBe(true);
    expect(note.text.length).toBeLessThanOrEqual(201);
    expect(note.text.endsWith("…")).toBe(true);
    expect(note.text).not.toMatch(/\s…$/);
  });
});

describe("progress demo", () => {
  it("starts at one of four stages and a two-day streak", () => {
    expect(demoMastery(PROGRESS_START)).toBe(25);
    expect(PROGRESS_START.streak).toBe(2);
  });

  it("adds mastery on every pass and one streak day for the first pass today", () => {
    const once = passDemoStage(PROGRESS_START);
    expect(demoMastery(once)).toBe(50);
    expect(once.streak).toBe(3);
    const twice = passDemoStage(once);
    expect(demoMastery(twice)).toBe(75);
    expect(twice.streak).toBe(3);
  });

  it("stops at the last stage", () => {
    let state = PROGRESS_START;
    for (let i = 0; i < 10; i += 1) state = passDemoStage(state);
    expect(state.passed).toBe(4);
    expect(demoMastery(state)).toBe(100);
    expect(passDemoStage(state)).toBe(state);
  });
});

describe("plan demo", () => {
  it("spreads more time over more days as the pace rises", () => {
    expect(weeklyMinutes("light")).toBe(90);
    expect(weeklyMinutes("steady")).toBe(225);
    expect(weeklyMinutes("intense")).toBe(360);
    expect(planWeek("light")).toHaveLength(3);
    expect(planWeek("intense")).toHaveLength(6);
  });

  it("ends every week with an explain-back and keeps session ids stable", () => {
    for (const pace of ["light", "steady", "intense"] as const) {
      const week = planWeek(pace);
      expect(week.at(-1)?.kind).toBe("Explain back");
      expect(week.map((session) => session.id)).toEqual(week.map((_, index) => `session-${index}`));
      expect(new Set(week.map((session) => session.day)).size).toBe(week.length);
      for (const session of week) expect(session.day).toBeGreaterThanOrEqual(0);
      for (const session of week) expect(session.day).toBeLessThan(7);
    }
  });

  it("formats minutes as hours and minutes", () => {
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(90)).toBe("1 h 30 min");
    expect(formatMinutes(360)).toBe("6 h");
  });
});

describe("beyond demo", () => {
  it("counts a tile as seen once it was opened, even after closing it", () => {
    let state = toggleBeyondTile(BEYOND_START, "nearby");
    expect(state.open).toEqual(["nearby"]);
    state = toggleBeyondTile(state, "nearby");
    expect(state.open).toEqual([]);
    expect(state.seen).toEqual(["nearby"]);
    expect(allBeyondSeen(state)).toBe(false);
  });

  it("is done when all three tiles were seen", () => {
    const state = BEYOND_TILES.reduce((acc, tile) => toggleBeyondTile(acc, tile.id), BEYOND_START);
    expect(allBeyondSeen(state)).toBe(true);
  });
});

describe("tour entry on Home", () => {
  it("shows the invite until the tour is finished or skipped, then only the replay link", () => {
    expect(tourEntry(null)).toBe("invite");
    expect(tourEntry(undefined)).toBe("invite");
    expect(tourEntry(new Date("2026-10-16T08:00:00Z"))).toBe("replay");
  });

  const lane = (statuses: string[]) =>
    statuses.map((status, index) => ({
      title: `Stage ${index + 1}`,
      status,
      href: status === "locked" ? "/roadmap/web" : `/lesson/s${index + 1}`,
      image: `/stages/web/${index + 1}.jpg`,
    }));

  it("sends a learner with no path to the niches", () => {
    expect(tourStartTarget([])).toEqual({ href: "/skills", stageTitle: null, pathName: null, image: null });
  });

  it("opens the first open stage of the first followed path", () => {
    const start = tourStartTarget([
      { skill: { name: "Web", image: "/skills/web.jpg" }, roadmapHref: "/roadmap/web", lane: lane(["done", "current", "locked"]) },
      { skill: { name: "Chess", image: "/skills/chess.jpg" }, roadmapHref: "/roadmap/chess", lane: lane(["ready"]) },
    ]);
    expect(start).toEqual({ href: "/lesson/s2", stageTitle: "Stage 2", pathName: "Web", image: "/stages/web/2.jpg" });
  });

  it("opens the path page when every stage is passed or there are none", () => {
    const done = tourStartTarget([
      { skill: { name: "Web", image: "/skills/web.jpg" }, roadmapHref: "/roadmap/web", lane: lane(["done", "done"]) },
    ]);
    expect(done).toMatchObject({ href: "/roadmap/web", stageTitle: null, pathName: "Web" });
    const empty = tourStartTarget([{ skill: { name: "Web", image: "/skills/web.jpg" }, roadmapHref: "/roadmap/web", lane: [] }]);
    expect(empty.href).toBe("/roadmap/web");
  });

  it("names the start button after where it goes", () => {
    expect(tourStartLabel({ href: "/lesson/s1", stageTitle: "Stage 1", pathName: "Web", image: null })).toBe("Start this stage");
    expect(tourStartLabel({ href: "/roadmap/web", stageTitle: null, pathName: "Web", image: null })).toBe("Open my path");
    expect(tourStartLabel({ href: "/skills", stageTitle: null, pathName: null, image: null })).toBe("Browse niches");
  });
});
