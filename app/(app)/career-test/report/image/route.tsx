import { ImageResponse } from "next/og";
import { auth } from "@/lib/auth";
import { AREAS, AREA_ORDER, DOMAINS, DOMAIN_ORDER } from "@/lib/career/meta";
import { loadCareerState } from "@/lib/data/career";
import { prisma } from "@/lib/prisma";

const WIDTH = 1080;
const HEIGHT = 2280;
const C = {
  bg: "#0b0f1e",
  card: "#141a2e",
  line: "#28304a",
  text: "#f4f6fb",
  muted: "#a3acc4",
  accent: "#8b9cff",
  bar: "#6f7ff5",
  track: "#232b44",
};

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** The report as one tall PNG. Personal: read on the request, sent with no-store, never cached. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Sign in to download your report.", { status: 401 });
  const state = await loadCareerState(session.user.id);
  if (state.status !== "complete") return new Response("Finish the test first.", { status: 404 });
  const { scores, report, completedAt } = state;
  const skills = await prisma.skill.findMany({
    where: { slug: { in: report.paths.map((path) => path.slug) } },
    select: { slug: true, name: true },
  });
  const names = new Map(skills.map((skill) => [skill.slug, skill.name]));
  const fit = new Map(scores.matches.map((match) => [match.slug, match.fit]));
  const areas = [...AREA_ORDER].sort((a, b) => scores.areas[b].raw - scores.areas[a].raw);
  const band = { low: "Low", average: "Middle", high: "High" } as const;
  const date = completedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const heading = (text: string) => (
    <div style={{ display: "flex", marginTop: 40, marginBottom: 18, fontSize: 30, fontWeight: 700, color: C.text }}>{text}</div>
  );
  const bar = (label: string, value: string, pct: number, note?: string) => (
    <div key={label} style={{ display: "flex", flexDirection: "column", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: C.text }}>
        <span>{label}</span>
        <span style={{ color: C.muted }}>{value}</span>
      </div>
      <div style={{ display: "flex", height: 12, marginTop: 8, borderRadius: 6, background: C.track }}>
        <div style={{ display: "flex", width: `${Math.max(pct, 2)}%`, height: 12, borderRadius: 6, background: C.bar }} />
      </div>
      {note ? <div style={{ display: "flex", marginTop: 6, fontSize: 17, color: C.muted }}>{note}</div> : null}
    </div>
  );

  const image = new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "64px 72px", background: C.bg, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, color: C.accent, letterSpacing: 2 }}>
          <span>SKILLFLOW · CAREER-FIT REPORT</span>
          <span style={{ color: C.muted, letterSpacing: 0 }}>{date}</span>
        </div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 52, fontWeight: 700, color: C.text }}>
          {clip(session.user.name ?? "Your results", 40)}
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 30 }}>
          {scores.code.map((area) => (
            <div
              key={area}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 200, padding: "18px 0", borderRadius: 20, background: C.card, border: `2px solid ${C.line}` }}
            >
              <span style={{ fontSize: 64, fontWeight: 700, color: C.accent }}>{area}</span>
              <span style={{ fontSize: 20, color: C.muted }}>{AREAS[area].name}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 24, lineHeight: 1.5, color: C.text }}>{clip(report.summary, 520)}</div>

        {heading("Paths that fit you best")}
        {report.paths.map((path, index) => (
          <div
            key={path.slug}
            style={{ display: "flex", flexDirection: "column", marginBottom: 14, padding: "18px 24px", borderRadius: 18, background: C.card, border: `2px solid ${C.line}` }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: C.text, fontWeight: 700 }}>
              <span>
                {index + 1}. {names.get(path.slug) ?? path.slug}
              </span>
              <span style={{ color: C.accent }}>{fit.get(path.slug) ?? 0}% fit</span>
            </div>
            <div style={{ display: "flex", marginTop: 8, fontSize: 19, lineHeight: 1.45, color: C.muted }}>{clip(path.why, 170)}</div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 440 }}>
            {heading("Interests")}
            {areas.map((area) => bar(AREAS[area].name, `${scores.areas[area].raw} / 40`, scores.areas[area].pct))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: 440 }}>
            {heading("Personality traits")}
            {DOMAIN_ORDER.map((domain) => bar(DOMAINS[domain].name, band[scores.domains[domain].band], scores.domains[domain].pct))}
          </div>
        </div>

        {heading("Likely strengths")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {report.strengths.slice(0, 6).map((item) => (
            <div key={item.title} style={{ display: "flex", padding: "10px 18px", borderRadius: 999, background: C.card, border: `2px solid ${C.line}`, fontSize: 21, color: C.text }}>
              {item.title}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", paddingTop: 30, borderTop: `2px solid ${C.line}`, fontSize: 15, lineHeight: 1.5, color: C.muted }}>
          <span>Personality: IPIP-NEO-120 (Johnson, 2014), public domain. Interests: O*NET® Interest Profiler Short Form by USDOL/ETA, CC BY 4.0.</span>
          <span>A self-discovery tool, not a clinical assessment or career counselling.</span>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
  image.headers.set("cache-control", "private, no-store");
  image.headers.set("content-disposition", 'inline; filename="skillflow-career-fit.png"');
  return image;
}
