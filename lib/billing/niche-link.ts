/** Where a niche card goes. Personal: a free account opens Premium on the upgrade page. */
export function nicheCardHref(input: {
  preview?: boolean;
  status: "available" | "coming_soon";
  offer: "FREE" | "MONETIZED";
  href: string | null;
  slug: string;
  premium: boolean;
}) {
  if (input.preview || input.status !== "available") return null;
  if (input.href) return input.href;
  if (input.offer !== "MONETIZED") return null;
  return input.premium ? `/roadmap/${input.slug}` : "/upgrade";
}
