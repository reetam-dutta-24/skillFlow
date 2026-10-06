import { describe, expect, it } from "vitest";
import {
  conceptsForGate,
  gateSourceBrief,
  gateSourceHash,
  gateStillCurrent,
  parseGateConcepts,
  withEveryKeyPoint,
} from "@/lib/explain/gate-concepts";

const stage = { title: "Lighting", description: "Place the lights." };
const resources = [
  {
    order: 2,
    title: "Three lights",
    description: "Key, fill, and back.",
    keyPoints: ["Place the key light", "Use fill to open the shadows"],
    transcript: null,
  },
  {
    order: 1,
    title: "Why light",
    description: "Light decides what the viewer sees.",
    keyPoints: ["Light shows the subject"],
    transcript: "A short transcript.",
  },
];

describe("gate source", () => {
  it("hashes the same resources in either order", () => {
    const forward = gateSourceHash(stage, resources);
    const backward = gateSourceHash(stage, [...resources].reverse());
    expect(forward).toBe(backward);
    expect(gateStillCurrent(forward, stage, resources)).toBe(true);
    expect(gateStillCurrent(forward, stage, [{ ...resources[0], keyPoints: ["Place the key light"] }])).toBe(false);
  });

  it("keeps key points ahead of article text", () => {
    const brief = gateSourceBrief({
      title: stage.title,
      description: stage.description,
      resources,
      pages: [{ title: "A guide", text: "Long article." }],
    });
    expect(brief.indexOf("Place the key light")).toBeLessThan(brief.indexOf("Long article."));
  });
});

describe("gate concepts", () => {
  it("reads a concept list and drops a duplicate", () => {
    const parsed = parseGateConcepts({
      concepts: [
        { concept: "Key light", rubric: "Says where the key light sits and what it does." },
        { name: "Key light", rubric: "Again." },
        { concept: "Fill", rubric: "Too short" },
      ],
    });
    expect(parsed).toEqual([
      { concept: "Key light", rubric: "Says where the key light sits and what it does." },
      { concept: "Fill", rubric: "Explains Fill in their own words: what it is, and why it matters." },
    ]);
    expect(parseGateConcepts("not json")).toBeNull();
  });

  it("adds a key point the model left out and keeps one it already covered", () => {
    const concepts = withEveryKeyPoint(
      [{ concept: "Aspect ratios", rubric: "Explains how the frame shape changes the crop." }],
      ["Aspect ratios and why they matter", "Official upload specs"],
    );
    expect(concepts.map((item) => item.concept)).toEqual(["Aspect ratios", "Official upload specs"]);
  });

  it("asks only the stored ideas once they were generated", () => {
    expect(conceptsForGate(["Key light"], ["A longer rubric line"], true)).toEqual(["Key light"]);
    expect(conceptsForGate(["Key light"], ["A longer rubric line"], false)).toEqual(["Key light", "A longer rubric line"]);
  });
});
