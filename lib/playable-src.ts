/** Turn a stored YouTube link into an embed the lesson player can show. */
export function playableSrc(url: string) {
  try {
    const next = new URL(url);
    const host = next.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") {
      id = next.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
      if (next.pathname === "/watch") id = next.searchParams.get("v");
      else if (next.pathname.startsWith("/embed/") || next.pathname.startsWith("/shorts/")) {
        id = next.pathname.split("/")[2] ?? null;
      }
    }
    if (id) {
      const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
      embed.searchParams.set("autoplay", "1");
      return embed.toString();
    }
    next.searchParams.set("autoplay", "1");
    return next.toString();
  } catch {
    return url;
  }
}
