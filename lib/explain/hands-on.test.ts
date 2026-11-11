import { describe, expect, it } from "vitest";
import { FREE_PATH_SLUGS } from "@/lib/niches/tiers";
import { HANDS_ON_PATHS, MIN_WRITEUP_WORDS, checkProof, handsOnSpec, handsOnTask, linkWorthReading } from "@/lib/explain/hands-on";

const WRITE_UP = Array.from({ length: MIN_WRITEUP_WORDS }, (_, index) => `word${index}`).join(" ");

describe("which paths need hands-on proof", () => {
  it("covers only real free paths", () => {
    for (const slug of Object.keys(HANDS_ON_PATHS)) expect(FREE_PATH_SLUGS).toContain(slug);
  });

  it("asks for proof on practical paths and never on personal ones", () => {
    expect(handsOnSpec("full-stack-web-dev")?.kinds).toContain("link");
    expect(handsOnSpec("guitar")?.kinds).toContain("video");
    for (const slug of ["psychology", "nutrition", "personal-finance", "relationships", "self-grooming", "socializing"]) {
      expect(handsOnSpec(slug)).toBeNull();
    }
    expect(handsOnSpec("not-a-path")).toBeNull();
  });

  it("gives every practical path concrete examples and a task that names the stage", () => {
    for (const spec of Object.values(HANDS_ON_PATHS)) {
      expect(spec.kinds.length).toBeGreaterThan(0);
      expect(spec.examples.length).toBeGreaterThan(0);
    }
    expect(handsOnTask(HANDS_ON_PATHS.chess, " Forks and pins ")).toContain('"Forks and pins"');
  });
});

describe("checking a proof before any model call", () => {
  const code = HANDS_ON_PATHS["full-stack-web-dev"];

  it("accepts an https link or an uploaded file of the right kind, with a real write-up", () => {
    expect(checkProof(code, { kind: "link", url: "https://github.com/someone/todo", writeUp: WRITE_UP }).ok).toBe(true);
    expect(checkProof(code, { kind: "image", url: "/uploads/abc123.png", writeUp: WRITE_UP }).ok).toBe(true);
    expect(checkProof(code, { kind: "video", url: "/uploads/abc123.mp4", writeUp: WRITE_UP }).ok).toBe(true);
  });

  it("refuses a kind the path does not offer, a bad link, or a file of another kind", () => {
    expect(checkProof(code, { kind: "doc", url: "/uploads/abc.pdf", writeUp: WRITE_UP })).toEqual({ ok: false, error: "Choose what you are showing." });
    expect(checkProof(code, { kind: "link", url: "http://insecure.example", writeUp: WRITE_UP }).ok).toBe(false);
    expect(checkProof(code, { kind: "link", url: "javascript:alert(1)", writeUp: WRITE_UP }).ok).toBe(false);
    expect(checkProof(code, { kind: "image", url: "/uploads/abc.mp4", writeUp: WRITE_UP }).ok).toBe(false);
    expect(checkProof(code, { kind: "image", url: "/uploads/../secret.png", writeUp: WRITE_UP }).ok).toBe(false);
    expect(checkProof(code, { kind: "image", url: "https://elsewhere.example/a.png", writeUp: WRITE_UP }).ok).toBe(false);
  });

  it("needs a write-up of real length", () => {
    const short = checkProof(code, { kind: "link", url: "https://github.com/someone/todo", writeUp: "I built it." });
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.error).toMatch(String(MIN_WRITEUP_WORDS));
  });
});

describe("reading a linked page", () => {
  it("reads repositories and write-ups, not players or drives", () => {
    expect(linkWorthReading("https://github.com/someone/todo")).toBe(true);
    expect(linkWorthReading("https://lichess.org/study/abc")).toBe(true);
    expect(linkWorthReading("https://www.youtube.com/watch?v=abc")).toBe(false);
    expect(linkWorthReading("https://youtu.be/abc")).toBe(false);
    expect(linkWorthReading("https://drive.google.com/file/d/abc")).toBe(false);
    expect(linkWorthReading("not a url")).toBe(false);
  });
});
