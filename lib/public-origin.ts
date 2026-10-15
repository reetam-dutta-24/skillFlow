/**
 * The address people use to reach the site, for building redirects and return URLs.
 *
 * Behind a reverse proxy (Caddy in production) the server sees its own requests as
 * http://localhost:3000, so `new URL(request.url).origin` would send people to localhost.
 * AUTH_URL is the public address set in production; without it (local development) the
 * forwarded headers, then the request itself, are used.
 */
export function publicOrigin(
  headers: Headers,
  requestUrl: string,
  configured: string | undefined = process.env.AUTH_URL,
): string {
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // A malformed AUTH_URL is caught by env validation at startup; fall through here.
    }
  }
  const host = headers.get("x-forwarded-host")?.split(",")[0]?.trim() || headers.get("host");
  if (host) {
    const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const proto = forwardedProto || new URL(requestUrl).protocol.replace(":", "");
    return `${proto}://${host}`;
  }
  return new URL(requestUrl).origin;
}
