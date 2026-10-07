// Plain module (no "use client"): the server page and the client forms both build CMS links with it.

/** `/admin/catalog` with the CMS selection in the query string, so every view has a link and the back button works. */
export function cmsHref(params: { niche?: string; tab?: "stages" | "details"; stage?: string; resource?: string; create?: "niche" }) {
  const query = new URLSearchParams();
  if (params.create) query.set("create", params.create);
  if (params.niche) query.set("niche", params.niche);
  if (params.tab && params.tab !== "stages") query.set("tab", params.tab);
  if (params.stage) query.set("stage", params.stage);
  if (params.resource) query.set("resource", params.resource);
  const text = query.toString();
  return text ? `/admin/catalog?${text}` : "/admin/catalog";
}
