import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Allowlist of where each kind of content may come from.
const csp = [
  "default-src 'self'",
  // Inline: theme boot scripts + Next's own. Dev also needs eval for Turbopack.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Event photos, Google avatars and contribution images come from unknown hosts.
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  // Browser-side calls: our API + map tiles.
  "connect-src 'self' https://tile.openstreetmap.org",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  // Google sign-in and Stripe redirect after a form post.
  "form-action 'self' https://accounts.google.com https://checkout.stripe.com https://billing.stripe.com",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()" },
  // HTTPS-only promise for 2 years. Only in production: localhost has no HTTPS.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false, // stop advertising "X-Powered-By: Next.js"
  // Dev only. Keeps the Next.js "N" badge off the SkillFlow wordmark and the mobile menu button.
  devIndicators: { position: "bottom-right" },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "45mb",
    },
    // The signed-in proxy reads the body. Its default 10mb cap was cutting video uploads short.
    proxyClientMaxBodySize: "45mb",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;