import { ImageResponse } from "next/og";
import { auth } from "@/lib/auth";
import { loadDetoxOverview } from "@/lib/data/detox";
import { screenBand } from "@/lib/detox/questions";
import { NOT_MEDICAL } from "@/lib/detox/state";

const WIDTH = 1080;
const HEIGHT = 1350;
const C = {
  bg: "#081521",
  card: "#102233",
  line: "#21384c",
  text: "#f4f8fb",
  muted: "#a6b7c6",
  accent: "#5ef6ff",
  up: "#34d399",
  down: "#fbbf24",
};

function signed(value: number) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return "0";
}

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Before and after, as one PNG to share. Personal: read on the request, sent with no-store, never cached. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Sign in to download your card.", { status: 401 });
  const overview = await loadDetoxOverview(session.user.id);
  if (!overview.ready) return new Response("Take the self-check first.", { status: 404 });
  const { score, baseline, band, kpis, breakdown, completedAt } = overview.ready;
  const delta = score - baseline;
  const since = completedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const name = clip(session.user.name?.trim().split(/\s+/)[0] ?? "", 24);

  const box = (label: string, value: string, tone = C.text) => (
    <div
      key={label}
      style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 24px", borderRadius: 22, background: C.card, border: `2px solid ${C.line}` }}
    >
      <span style={{ fontSize: 20, color: C.muted }}>{label}</span>
      <span style={{ marginTop: 8, fontSize: 40, fontWeight: 700, color: tone }}>{value}</span>
    </div>
  );

  const image = new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "64px 72px", background: C.bg, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: C.accent, letterSpacing: 2 }}>
          <span>SKILLFLOW · DOPAMINE DETOX</span>
          <span style={{ color: C.muted, letterSpacing: 0 }}>since {since}</span>
        </div>
        <div style={{ display: "flex", marginTop: 22, fontSize: 54, fontWeight: 700, color: C.text }}>
          {name ? `${name}'s detox, with proof` : "My detox, with proof"}
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 44, alignItems: "stretch" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "30px 32px", borderRadius: 28, background: C.card, border: `2px solid ${C.line}` }}>
            <span style={{ fontSize: 24, color: C.muted }}>Before</span>
            <span style={{ fontSize: 120, fontWeight: 700, color: C.muted, lineHeight: 1.05 }}>{signed(baseline)}</span>
            <span style={{ fontSize: 22, color: C.muted }}>Starting Detox Score</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 56, color: C.accent }}>→</div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "30px 32px", borderRadius: 28, background: C.card, border: `3px solid ${C.accent}` }}>
            <span style={{ fontSize: 24, color: C.accent }}>Now</span>
            <span style={{ fontSize: 120, fontWeight: 700, color: C.text, lineHeight: 1.05 }}>{signed(score)}</span>
            <span style={{ fontSize: 22, color: C.text }}>{band.label}</span>
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 28, fontSize: 30, fontWeight: 700, color: delta >= 0 ? C.up : C.down }}>
          {delta >= 0 ? `${signed(delta)} points, earned from real learning` : `${signed(delta)} points since the start`}
        </div>
        <div style={{ display: "flex", marginTop: 10, fontSize: 24, lineHeight: 1.45, color: C.muted }}>{clip(breakdown.summary, 150)}</div>

        <div style={{ display: "flex", gap: 18, marginTop: 40 }}>
          {box("Days active", String(kpis.daysActive))}
          {box("Ideas passed", String(kpis.ideasPassed))}
          {box("Focused minutes", String(kpis.focusedMinutes))}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 18 }}>
          {box("Average recall", kpis.averageRecall === null ? "—" : `${kpis.averageRecall} / 100`)}
          {box("Screen time", kpis.screenTo ? `${screenBand(kpis.screenFrom).hours}h → ${screenBand(kpis.screenTo).hours}h` : `${screenBand(kpis.screenFrom).hours}h a day`)}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", paddingTop: 28, borderTop: `2px solid ${C.line}`, fontSize: 18, lineHeight: 1.5, color: C.muted }}>
          <span>The Detox Score is worked out by SkillFlow from self-check answers and verified learning: passed ideas, recalls, focus sessions.</span>
          <span>{NOT_MEDICAL}</span>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
  image.headers.set("cache-control", "private, no-store");
  image.headers.set("content-disposition", 'inline; filename="skillflow-detox.png"');
  return image;
}
