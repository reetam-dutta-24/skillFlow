// Paste into the browser console (or evaluate over DevTools) on any page: lists sideways overflow, unnamed controls,
// images without alt, unlabeled inputs, targets under 24px, the h1 count, duplicate ids, and heading skips.
// Targets widened with an invisible ::after still show under "small"; check those by eye.
(() => {
  const out = { path: location.pathname, overflow: [], unnamed: [], noAlt: [], unlabeled: [], small: [], h1: 0, dupIds: [], headingSkips: [] };
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !el.closest("[inert],[aria-hidden='true']");
  };
  const desc = (el) => {
    const cls = typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 2).join(".") : "";
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls ? "." + cls : ""} "${(el.textContent || "").trim().slice(0, 30)}"`;
  };
  const W = document.documentElement.clientWidth;
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.right > W + 1 && vis(el) && getComputedStyle(el).position !== "fixed") {
      let p = el.parentElement, clipped = false;
      while (p && p !== document.body) {
        const ov = getComputedStyle(p).overflowX;
        if (ov === "hidden" || ov === "auto" || ov === "scroll" || ov === "clip") { clipped = true; break; }
        p = p.parentElement;
      }
      if (!clipped) out.overflow.push(desc(el) + ` right=${Math.round(r.right)}`);
    }
  }
  const name = (el) => {
    const lb = el.getAttribute("aria-labelledby");
    if (lb) return lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ").trim();
    return (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || el.querySelector("img[alt]")?.getAttribute("alt") || el.value || "").trim();
  };
  for (const el of document.querySelectorAll("a[href],button,[role=button],[role=tab],[role=option],summary")) {
    if (!vis(el)) continue;
    if (!name(el)) out.unnamed.push(desc(el));
    const r = el.getBoundingClientRect();
    const inline = el.tagName === "A" && getComputedStyle(el).display === "inline";
    if (!inline && (r.width < 24 || r.height < 24)) out.small.push(desc(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  for (const img of document.querySelectorAll("img")) if (!img.hasAttribute("alt")) out.noAlt.push(img.src.slice(-60));
  for (const el of document.querySelectorAll("input,select,textarea")) {
    if (el.type === "hidden" || !vis(el) && el.type !== "file") continue;
    const labelled = el.labels?.length || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title");
    if (!labelled) out.unlabeled.push(desc(el) + ` type=${el.type}`);
  }
  out.h1 = [...document.querySelectorAll("h1")].filter(vis).length;
  const seen = {};
  for (const el of document.querySelectorAll("[id]")) seen[el.id] = (seen[el.id] || 0) + 1;
  out.dupIds = Object.entries(seen).filter(([, n]) => n > 1).map(([id]) => id);
  let last = 0;
  for (const h of document.querySelectorAll("main h1,main h2,main h3,main h4")) {
    if (!vis(h)) continue;
    const lvl = Number(h.tagName[1]);
    if (last && lvl > last + 1) out.headingSkips.push(`h${last}->h${lvl} "${h.textContent.trim().slice(0, 30)}"`);
    last = lvl;
  }
  for (const k of ["overflow", "unnamed", "small", "unlabeled"]) out[k] = [...new Set(out[k])].slice(0, 12);
  return out;
})()
