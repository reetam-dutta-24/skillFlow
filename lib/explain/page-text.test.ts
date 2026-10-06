import { describe, expect, it } from "vitest";
import { assemblePracticeSource, classifyPracticeUrl, htmlToText, planPracticeUrls, textWithoutUrls } from "@/lib/explain/page-text";

describe("practice page text", () => {
  it("keeps a public link and drops tracking parameters", () => {
    const classified = classifyPracticeUrl(
      "https://www.exed.hbs.edu/strategic-marketing-driving-growth?utm_source=google&gclid=abc&id=course",
    );
    expect(classified).toEqual({
      kind: "page",
      url: "https://www.exed.hbs.edu/strategic-marketing-driving-growth?id=course",
    });
  });

  it("refuses a local or private address", () => {
    expect(classifyPracticeUrl("http://127.0.0.1:3000/notes").kind).toBe("blocked");
    expect(classifyPracticeUrl("https://localhost/secret").kind).toBe("blocked");
    expect(classifyPracticeUrl("http://192.168.0.8/notes").kind).toBe("blocked");
    expect(planPracticeUrls("See https://example.com/a and http://127.0.0.1/x").blocked).toBe(true);
  });

  it("reads the article and ignores a script", () => {
    const text = htmlToText(`
      <html><head><script>secret token</script><style>.x{}</style></head>
      <body><nav>Home</nav><article><p>A key light is the main light on a subject.</p></article></body></html>
    `);
    expect(text).toContain("key light is the main light");
    expect(text).not.toContain("secret token");
    expect(text).not.toContain("Home");
  });

  it("grades fetched page text instead of the bare address", () => {
    const pasted = "https://example.com/lesson?utm_source=google";
    expect(textWithoutUrls(pasted)).toBe("");
    const source = assemblePracticeSource(
      ["Page (https://example.com/lesson):\nA key light is the main light on a subject, and a fill light softens its shadows."],
      pasted,
    );
    expect(source).toContain("key light");
    expect(source).not.toContain("utm_source");
  });
});
