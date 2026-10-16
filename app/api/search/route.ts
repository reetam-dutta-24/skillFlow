import { auth } from "@/lib/auth";
import { loadSearchIndex } from "@/lib/data/search";
import { searchEntries } from "@/lib/search/score";

const MAX_QUERY = 80;

/**
 * Catalog and Open Source search for the top bar. Signed-in only. The index is cached for everyone (catalog and
 * community tags); the ranking runs per request, and the answer is never stored by the browser or a proxy.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ hits: [] }, { status: 401 });
  const query = (new URL(request.url).searchParams.get("q") ?? "").slice(0, MAX_QUERY).trim();
  if (query.length < 2) return Response.json({ hits: [] }, { headers: { "cache-control": "private, no-store" } });
  const index = await loadSearchIndex();
  const hits = searchEntries(index, query, 24).map(({ id, kind, title, description, href, icon, badge, score }) => ({ id, kind, title, description, href, icon, badge, score }));
  return Response.json({ hits }, { headers: { "cache-control": "private, no-store" } });
}
